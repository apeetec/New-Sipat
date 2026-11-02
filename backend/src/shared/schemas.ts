import { z } from "zod";

export const uuidParam = z.object({ id: z.string().uuid() });
export const slugParam = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9-]+$/),
});
export const pageQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(50),
    search: z.string().trim().max(200).optional(),
  })
  .passthrough();
export const safeUrl = z
  .string()
  .url()
  .max(2048)
  .refine(
    (url) => ["http:", "https:"].includes(new URL(url).protocol),
    "URL deve usar HTTP ou HTTPS",
  );
export const optionalUrl = z
  .union([safeUrl, z.literal(""), z.null()])
  .optional();
export const cleanText = (max: number) => z.string().trim().min(1).max(max);
export const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();
