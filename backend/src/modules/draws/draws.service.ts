import { randomInt, randomUUID } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { execute, rows, transaction } from "../../database/pool.js";
import { AppError, notFound } from "../../shared/errors.js";
import { maskEmployeeNumber } from "../../shared/security.js";
import { toPublicUser } from "../auth/auth.service.js";
import type { UserRow } from "../auth/auth.repository.js";
import type { AuthUser } from "../auth/auth.types.js";
import { auditRepository } from "../audit/audit.repository.js";
type Criteria = {
  scope: { type: "day"; eventDayId: string } | { type: "full_week" };
  unitIds: string[];
  excludePreviousWinners: boolean;
};
export class DrawsService {
  private async eligible(auth: AuthUser, c: Criteria, db?: PoolConnection) {
    const params: any[] = [auth.campaignId, auth.organizationId];
    let eligibility = "";
    if (c.scope.type === "day") {
      eligibility = `EXISTS(SELECT 1 FROM participations p WHERE p.user_id=u.id AND p.event_day_id=? AND p.status='submitted' AND p.perfect_score=1 AND p.deleted_at IS NULL)`;
      params.push(c.scope.eventDayId);
    } else {
      eligibility = `(SELECT COUNT(*) FROM event_days ed WHERE ed.campaign_id=? AND ed.active=1 AND ed.counts_for_full_week=1 AND ed.deleted_at IS NULL)>0 AND (SELECT COUNT(DISTINCT p.event_day_id) FROM participations p JOIN event_days ed2 ON ed2.id=p.event_day_id WHERE p.user_id=u.id AND p.status='submitted' AND p.perfect_score=1 AND p.deleted_at IS NULL AND ed2.campaign_id=? AND ed2.active=1 AND ed2.counts_for_full_week=1 AND ed2.deleted_at IS NULL)=(SELECT COUNT(*) FROM event_days ed3 WHERE ed3.campaign_id=? AND ed3.active=1 AND ed3.counts_for_full_week=1 AND ed3.deleted_at IS NULL)`;
      params.push(auth.campaignId, auth.campaignId, auth.campaignId);
    }
    let unit = "";
    if (!c.unitIds.includes("all")) {
      unit = ` AND u.unit_id IN (${c.unitIds.map(() => "?").join(",")})`;
      params.push(...c.unitIds);
    }
    let previous = "";
    if (c.excludePreviousWinners)
      ((previous = ` AND NOT EXISTS(SELECT 1 FROM draw_winners dw JOIN draws d ON d.id=dw.draw_id WHERE dw.user_id=u.id AND d.campaign_id=? AND d.status='published' AND d.deleted_at IS NULL AND dw.deleted_at IS NULL)`),
        params.push(auth.campaignId));
    return rows<UserRow[]>(
      `SELECT u.*,un.slug unit_slug,un.name unit_name,? campaign_id,NULL regulation_version,NULL regulation_accepted_at FROM users u LEFT JOIN units un ON un.id=u.unit_id WHERE u.organization_id=? AND u.role='collaborator' AND u.active=1 AND u.deleted_at IS NULL AND ${eligibility}${unit}${previous} ORDER BY u.id`,
      params,
      db,
    );
  }
  async preview(auth: AuthUser, c: Criteria) {
    return (await this.eligible(auth, c)).map(toPublicUser);
  }
  async executeDraw(auth: AuthUser, data: any, ip?: string) {
    return transaction(async (db) => {
      const lockName = `sipat_draw_${auth.campaignId}`;
      // A trava consultiva evita dois sorteios da mesma campanha usando o mesmo pool.
      const lock = await rows<(RowDataPacket & { acquired: number })[]>(
        "SELECT GET_LOCK(?,5) acquired",
        [lockName],
        db,
      );
      if (!lock[0]?.acquired)
        throw new AppError(
          409,
          "DRAW_IN_PROGRESS",
          "Outro sorteio está em execução.",
        );
      try {
        const eligible = await this.eligible(auth, data, db);
        if (!eligible.length)
          throw new AppError(
            422,
            "NO_ELIGIBLE_USERS",
            "Nenhum colaborador elegível foi encontrado.",
          );
        const pool = [...eligible];
        // Fisher-Yates com randomInt evita viés de módulo e não depende da animação do browser.
        for (let i = pool.length - 1; i > 0; i--) {
          const j = randomInt(i + 1);
          [pool[i], pool[j]] = [pool[j]!, pool[i]!];
        }
        const winners = pool.slice(
          0,
          Math.min(data.requestedWinnerCount, pool.length),
        );
        const id = randomUUID();
        await execute(
          `INSERT INTO draws(id,campaign_id,scope_type,scope_event_day_id,prize_name,prize_image_url,group_name,requested_winner_count,actual_winner_count,exclude_previous_winners,eligible_count,status,created_by)VALUES(?,?,?,?,?,?,?,?,?,?,?,'published',?)`,
          [
            id,
            auth.campaignId,
            data.scope.type,
            data.scope.type === "day" ? data.scope.eventDayId : null,
            data.prizeName,
            data.prizeImageUrl || null,
            data.groupName,
            data.requestedWinnerCount,
            winners.length,
            data.excludePreviousWinners ? 1 : 0,
            eligible.length,
            auth.id,
          ],
          db,
        );
        for (const unitId of data.unitIds)
          if (unitId !== "all")
            await execute(
              "INSERT INTO draw_units(draw_id,unit_id)VALUES(?,?)",
              [id, unitId],
              db,
            );
        // O snapshot permite provar posteriormente quem era elegível no instante do sorteio.
        for (const u of eligible)
          await execute(
            "INSERT INTO draw_eligible_users(draw_id,user_id)VALUES(?,?)",
            [id, u.id],
            db,
          );
        let position = 1;
        for (const u of winners)
          await execute(
            `INSERT INTO draw_winners(id,draw_id,user_id,winner_position,employee_number_snapshot,name_snapshot,email_snapshot,unit_name_snapshot,company_name_snapshot)VALUES(?,?,?,?,?,?,?,?,?)`,
            [
              randomUUID(),
              id,
              u.id,
              position++,
              u.employee_number,
              u.display_name,
              u.email,
              u.unit_name ?? "Unidade não informada",
              u.company_name,
            ],
            db,
          );
        await auditRepository.write(
          auth,
          "EXECUTE_DRAW",
          "draws",
          id,
          undefined,
          { eligibleCount: eligible.length, winnerCount: winners.length },
          ip,
          db,
        );
        return this.get(id, db);
      } finally {
        await rows("SELECT RELEASE_LOCK(?)", [lockName], db);
      }
    });
  }
  async get(id: string, db?: PoolConnection) {
    const d = await rows<RowDataPacket[]>(
      "SELECT * FROM draws WHERE id=? AND deleted_at IS NULL",
      [id],
      db,
    );
    if (!d[0]) throw notFound("Sorteio");
    const wins = await rows<RowDataPacket[]>(
      "SELECT * FROM draw_winners WHERE draw_id=? AND deleted_at IS NULL ORDER BY winner_position",
      [id],
      db,
    );
    const units = await rows<RowDataPacket[]>(
      "SELECT unit_id FROM draw_units WHERE draw_id=?",
      [id],
      db,
    );
    const eligible = await rows<RowDataPacket[]>(
      "SELECT user_id FROM draw_eligible_users WHERE draw_id=?",
      [id],
      db,
    );
    const x = d[0];
    return {
      id: x.id,
      prizeName: x.prize_name,
      prizeImageUrl: x.prize_image_url ?? undefined,
      groupName: x.group_name,
      scope:
        x.scope_type === "day"
          ? { type: "day", eventDayId: x.scope_event_day_id }
          : { type: "full_week" },
      unitIds: units.length ? units.map((u) => u.unit_id) : ["all"],
      requestedWinnerCount: x.requested_winner_count,
      actualWinnerCount: x.actual_winner_count,
      excludePreviousWinners: Boolean(x.exclude_previous_winners),
      eligibleCount: x.eligible_count,
      eligibleUserIdsSnapshot: eligible.map((e) => e.user_id),
      winners: wins.map((w) => ({
        userId: w.user_id,
        employeeNumber: w.employee_number_snapshot,
        name: w.name_snapshot,
        email: w.email_snapshot,
        unitName: w.unit_name_snapshot,
        company: w.company_name_snapshot ?? undefined,
        position: w.winner_position,
      })),
      status: x.status,
      voidReason: x.void_reason ?? undefined,
      createdBy: x.created_by,
      createdAt: x.created_at.toISOString(),
      voidedBy: x.voided_by ?? undefined,
      voidedAt: x.voided_at?.toISOString(),
    };
  }
  async list(campaignId: string, publicView = false, eventDayId?: string) {
    const where = ["campaign_id=?", "deleted_at IS NULL"];
    const p: any[] = [campaignId];
    if (publicView) where.push("status='published'");
    if (eventDayId) {
      where.push("scope_type='day' AND scope_event_day_id=?");
      p.push(eventDayId);
    }
    const ids = await rows<RowDataPacket[]>(
      `SELECT id FROM draws WHERE ${where.join(" AND ")} ORDER BY created_at DESC`,
      p,
    );
    const all = [];
    for (const x of ids) all.push(await this.get(x.id));
    if (publicView) {
      const settings = await rows<RowDataPacket[]>(
        "SELECT mask_employee_number_in_winners FROM campaign_settings WHERE campaign_id=?",
        [campaignId],
      );
      if (settings[0]?.mask_employee_number_in_winners)
        for (const d of all)
          for (const w of d.winners)
            w.employeeNumber = maskEmployeeNumber(w.employeeNumber);
    }
    return all;
  }
  async void(auth: AuthUser, id: string, reason: string, ip?: string) {
    const r = await execute(
      `UPDATE draws SET status='voided',void_reason=?,voided_by=?,voided_at=UTC_TIMESTAMP(3) WHERE id=? AND campaign_id=? AND status='published' AND deleted_at IS NULL`,
      [reason, auth.id, id, auth.campaignId],
    );
    if (!r.affectedRows)
      throw new AppError(
        409,
        "DRAW_NOT_VOIDABLE",
        "Sorteio inexistente ou já anulado.",
      );
    await auditRepository.write(
      auth,
      "VOID_DRAW",
      "draws",
      id,
      undefined,
      { reason },
      ip,
    );
    return this.get(id);
  }
}
export const drawsService = new DrawsService();
