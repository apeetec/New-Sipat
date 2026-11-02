import { Router } from "express";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { env } from "../../config/env.js";
import { rows } from "../../database/pool.js";
import { requireAdmin, requireAuth } from "../../middlewares/auth.js";
import { sensitiveLimiter } from "../../middlewares/security.js";
import { asyncHandler, validate } from "../../shared/http.js";
import { notFound } from "../../shared/errors.js";
import { uuidParam } from "../../shared/schemas.js";
import { drawsService } from "./draws.service.js";
import {
  executeDrawSchema,
  previewSchema,
  voidSchema,
} from "./draws.schemas.js";

async function defaultCampaignId() {
  const result = await rows<(RowDataPacket & { id: string })[]>(
    `SELECT c.id FROM campaigns c JOIN organizations o ON o.id=c.organization_id
    WHERE o.slug=? AND c.slug=? AND c.active=1 AND c.deleted_at IS NULL LIMIT 1`,
    [env.DEFAULT_ORGANIZATION_SLUG, env.DEFAULT_CAMPAIGN_SLUG],
  );
  if (!result[0]) throw notFound("Campanha");
  return result[0].id;
}

export const winnersRouter = Router();
winnersRouter.get(
  "/",
  validate({ query: z.object({ dayId: z.string().uuid().optional() }) }),
  asyncHandler(async (req, res) =>
    res.json(
      await drawsService.list(
        await defaultCampaignId(),
        true,
        req.query.dayId as string | undefined,
      ),
    ),
  ),
);

export const drawsAdminRouter = Router();
drawsAdminRouter.use(requireAuth, requireAdmin);
drawsAdminRouter.get(
  "/",
  asyncHandler(async (req, res) =>
    res.json(await drawsService.list(req.auth!.campaignId)),
  ),
);
drawsAdminRouter.post(
  "/preview",
  sensitiveLimiter,
  validate({ body: previewSchema }),
  asyncHandler(async (req, res) =>
    res.json(await drawsService.preview(req.auth!, req.body)),
  ),
);
drawsAdminRouter.post(
  "/execute",
  sensitiveLimiter,
  validate({ body: executeDrawSchema }),
  asyncHandler(async (req, res) =>
    res
      .status(201)
      .json(await drawsService.executeDraw(req.auth!, req.body, req.ip)),
  ),
);
drawsAdminRouter.post(
  "/:id/void",
  sensitiveLimiter,
  validate({ params: uuidParam, body: voidSchema }),
  asyncHandler(async (req, res) =>
    res.json(
      await drawsService.void(
        req.auth!,
        String(req.params.id),
        req.body.reason,
        req.ip,
      ),
    ),
  ),
);
