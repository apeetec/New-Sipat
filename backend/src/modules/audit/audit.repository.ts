import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { execute, rows, type DbConnection } from "../../database/pool.js";
import { hashIp } from "../../shared/security.js";
import type { AuthUser } from "../auth/auth.types.js";

export class AuditRepository {
  async write(
    actor: AuthUser,
    action: string,
    entityType: string,
    entityId: string,
    beforeData?: unknown,
    afterData?: unknown,
    ip?: string,
    db?: DbConnection,
  ) {
    const id = randomUUID();
    await execute(
      `INSERT INTO audit_logs
      (id, organization_id, campaign_id, actor_user_id, actor_name_snapshot, action, entity_type, entity_id, before_data, after_data, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        actor.organizationId,
        actor.campaignId,
        actor.id,
        actor.displayName,
        action,
        entityType,
        entityId,
        beforeData ? JSON.stringify(beforeData) : null,
        afterData ? JSON.stringify(afterData) : null,
        hashIp(ip),
      ],
      db,
    );
    return { id, timestamp: new Date().toISOString() };
  }

  async listAudit(organizationId: string, limit: number) {
    return rows<RowDataPacket[]>(
      `SELECT id, actor_user_id AS actorUserId, actor_name_snapshot AS actorName,
      action, entity_type AS entity, entity_id AS entityId, before_data AS beforeData, after_data AS afterData,
      occurred_at AS timestamp, ip_hash AS ipHash FROM audit_logs WHERE organization_id = ?
      ORDER BY occurred_at DESC LIMIT ?`,
      [organizationId, limit],
    );
  }

  async listAccess(organizationId: string, limit: number) {
    return rows<RowDataPacket[]>(
      `SELECT id, user_id AS userId, employee_number_attempted AS employeeNumber,
      occurred_at AS timestamp, result, failure_reason AS failureReason, ip_hash AS ipHash,
      user_agent_summary AS userAgentSummary FROM access_logs WHERE organization_id = ?
      ORDER BY occurred_at DESC LIMIT ?`,
      [organizationId, limit],
    );
  }
}

export const auditRepository = new AuditRepository();
