import { z } from "zod";

export const attendanceSchema = z
  .object({
    attendanceCode: z.string().trim().min(4).max(64),
    modality: z.literal("in_person").default("in_person"),
  })
  .strict();
export const progressSchema = z
  .object({
    currentSeconds: z.number().finite().min(0),
    durationSeconds: z.number().finite().positive().max(86400),
    clientEventId: z.string().uuid().optional(),
  })
  .strict()
  .refine((v) => v.currentSeconds <= v.durationSeconds, {
    path: ["currentSeconds"],
    message: "Progresso não pode exceder a duração.",
  });
const answer = z
  .object({
    alternativeId: z.string().uuid().optional(),
    text: z.string().trim().max(10000).optional(),
    rating: z.number().int().min(1).max(10).optional(),
  })
  .strict();
export const quizSchema = z
  .object({
    answers: z.record(z.string().uuid(), answer),
    suggestions: z
      .record(z.string().uuid(), z.string().trim().max(2000))
      .default({}),
  })
  .strict();
