import { Router } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { env } from "../../config/env.js";
import { rows } from "../../database/pool.js";
import { asyncHandler } from "../../shared/http.js";
import { notFound } from "../../shared/errors.js";
import { adminRepository } from "../admin/admin.repository.js";
async function campaignId() {
  const result = await rows<(RowDataPacket & { id: string })[]>(
    `SELECT c.id FROM campaigns c JOIN organizations o ON o.id=c.organization_id WHERE o.slug=? AND c.slug=? AND c.active=1 AND c.deleted_at IS NULL AND o.deleted_at IS NULL LIMIT 1`,
    [env.DEFAULT_ORGANIZATION_SLUG, env.DEFAULT_CAMPAIGN_SLUG],
  );
  if (!result[0]) throw notFound("Campanha ativa");
  return result[0].id;
}
export const publicRouter = Router();
publicRouter.get(
  "/settings",
  asyncHandler(async (_req, res) =>
    res.json(await adminRepository.getSettings(await campaignId())),
  ),
);
publicRouter.get(
  "/regulations/current",
  asyncHandler(async (_req, res) =>
    res.json(await adminRepository.getRegulation(await campaignId())),
  ),
);
