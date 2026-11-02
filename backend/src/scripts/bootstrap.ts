import "bcryptjs";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { execute, pool, rows, transaction } from "../database/pool.js";
import type { RowDataPacket } from "mysql2/promise";
const employee = process.env.BOOTSTRAP_ADMIN_EMPLOYEE?.trim();
const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
if (!employee || !email || !password || password.length < 12)
  throw new Error(
    "Defina BOOTSTRAP_ADMIN_EMPLOYEE, BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD com no mínimo 12 caracteres.",
  );
await transaction(async (db) => {
  let org = (
    await rows<(RowDataPacket & { id: string })[]>(
      "SELECT id FROM organizations WHERE slug=?",
      [env.DEFAULT_ORGANIZATION_SLUG],
      db,
    )
  )[0];
  if (!org) {
    org = { id: randomUUID() } as any;
    await execute(
      "INSERT INTO organizations(id,name,slug)VALUES(?,?,?)",
      [org!.id, "Honda Automóveis do Brasil", env.DEFAULT_ORGANIZATION_SLUG],
      db,
    );
  }
  let campaign = (
    await rows<(RowDataPacket & { id: string })[]>(
      "SELECT id FROM campaigns WHERE organization_id=? AND slug=?",
      [org!.id, env.DEFAULT_CAMPAIGN_SLUG],
      db,
    )
  )[0];
  if (!campaign) {
    campaign = { id: randomUUID() } as any;
    await execute(
      "INSERT INTO campaigns(id,organization_id,name,slug,year,timezone)VALUES(?,?,?,?,?,?)",
      [
        campaign!.id,
        org!.id,
        "SIPAT Honda 2026",
        env.DEFAULT_CAMPAIGN_SLUG,
        2026,
        "America/Sao_Paulo",
      ],
      db,
    );
    await execute(
      "INSERT INTO campaign_settings(campaign_id,brand_name,initial_password_help_text)VALUES(?,?,?)",
      [
        campaign!.id,
        "SIPAT Honda",
        "Use a senha temporária fornecida pela administração.",
      ],
      db,
    );
  }
  const regulation = await rows<RowDataPacket[]>(
    "SELECT id FROM regulations WHERE campaign_id=? AND published=1 AND deleted_at IS NULL LIMIT 1",
    [campaign!.id],
    db,
  );
  if (!regulation[0])
    await execute(
      `INSERT INTO regulations(id,campaign_id,version,title,content_html,published,effective_from)
       VALUES(?,?,?,?,?,1,UTC_TIMESTAMP(3))`,
      [
        randomUUID(),
        campaign!.id,
        "2026.1",
        "Regulamento inicial da SIPAT",
        "<h2>Participação na SIPAT</h2><p>Ao continuar, declaro que li as orientações da campanha e concordo em participar de forma responsável, respeitando as regras de presença, questionários e sorteios.</p><p>O administrador poderá substituir este texto pela versão oficial antes da publicação em produção.</p>",
      ],
      db,
    );
  const exists = await rows<RowDataPacket[]>(
    "SELECT id FROM users WHERE organization_id=? AND employee_number=?",
    [org!.id, employee],
    db,
  );
  if (!exists[0])
    await execute(
      `INSERT INTO users(id,organization_id,employee_number,email,password_hash,first_name,last_name,display_name,role,must_change_password,active)VALUES(?,?,?,?,?,?,?,?, 'admin',1,1)`,
      [
        randomUUID(),
        org!.id,
        employee,
        email,
        await bcrypt.hash(password, env.PASSWORD_BCRYPT_ROUNDS),
        "Administrador",
        "Geral",
        "Administrador Geral",
      ],
      db,
    );
});
await pool.end();
console.log(
  "Bootstrap concluído. Troque a senha no primeiro acesso e remova as variáveis BOOTSTRAP_* do ambiente.",
);
