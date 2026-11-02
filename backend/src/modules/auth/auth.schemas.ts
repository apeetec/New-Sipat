import { z } from "zod";

const cleanEmployeeNumber = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[\p{L}\p{N}._-]+$/u);
const password = z.string().min(8).max(128);

export const loginSchema = z
  .object({
    employeeNumber: cleanEmployeeNumber,
    password: z.string().min(1).max(128),
  })
  .strict();
export const firstAccessSchema = z
  .object({
    currentPassword: z.string().max(128).optional(),
    newPassword: password.regex(/[A-Za-zÀ-ÿ]/).regex(/\d/),
  })
  .strict();
export const acceptRegulationSchema = z
  .object({ version: z.string().trim().min(1).max(40) })
  .strict();
export const changePasswordSchema = z
  .object({
    currentPassword: password,
    newPassword: password.regex(/[A-Za-zÀ-ÿ]/).regex(/\d/),
  })
  .strict();
