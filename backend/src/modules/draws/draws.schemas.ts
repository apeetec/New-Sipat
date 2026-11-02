import { z } from "zod";
import { optionalUrl } from "../../shared/schemas.js";
const scope = z.discriminatedUnion("type", [
  z.object({ type: z.literal("day"), eventDayId: z.string().uuid() }),
  z.object({ type: z.literal("full_week") }),
]);
export const previewSchema = z
  .object({
    scope,
    unitIds: z
      .union([z.array(z.string().uuid()).min(1), z.tuple([z.literal("all")])])
      .default(["all"]),
    excludePreviousWinners: z.boolean().default(true),
  })
  .strict();
export const executeDrawSchema = previewSchema
  .extend({
    prizeName: z.string().trim().min(1).max(255),
    prizeImageUrl: optionalUrl,
    groupName: z.string().trim().min(1).max(180).default("Grupo Geral"),
    requestedWinnerCount: z.number().int().min(1).max(100),
  })
  .strict();
export const voidSchema = z
  .object({ reason: z.string().trim().min(5).max(1000) })
  .strict();
