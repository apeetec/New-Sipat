import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Router, type RequestHandler } from "express";
import multer from "multer";
import nodemailer from "nodemailer";
import { z } from "zod";
import { env } from "../../config/env.js";
import { requireAdmin, requireAuth } from "../../middlewares/auth.js";
import { sensitiveLimiter } from "../../middlewares/security.js";
import { AppError } from "../../shared/errors.js";
import { asyncHandler } from "../../shared/http.js";
import { auditRepository } from "../audit/audit.repository.js";

const reportUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fields: 5,
    fileSize: 20 * 1024 * 1024,
    fieldNameSize: 40,
    fieldSize: 20_000,
    parts: 7,
  },
  fileFilter: (_req, file, callback) => {
    const accepted = new Set([
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "application/csv",
    ]);
    if (!accepted.has(file.mimetype))
      return callback(
        new AppError(
          422,
          "UNSUPPORTED_REPORT_TYPE",
          "O anexo deve ser XLSX ou CSV.",
        ),
      );
    callback(null, true);
  },
});

const receiveReport: RequestHandler = (req, res, next) => {
  reportUpload.single("attachment")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === "LIMIT_FILE_SIZE";
      return next(
        new AppError(
          tooLarge ? 413 : 422,
          tooLarge ? "REPORT_TOO_LARGE" : "INVALID_MULTIPART",
          tooLarge
            ? "O relatório excede o limite de 20 MB."
            : "Dados do relatório inválidos.",
        ),
      );
    }
    next(error);
  });
};

const recipientsSchema = z.string().transform((value, context) => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    context.addIssue({ code: "custom", message: "Destinatários inválidos." });
    return z.NEVER;
  }
}).pipe(z.array(z.string().email().max(254)).min(1).max(20));

const reportSchema = z
  .object({
    recipients: recipientsSchema,
    subject: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .refine((value) => !/[\r\n]/.test(value), "Assunto inválido."),
    message: z.string().trim().min(1).max(10_000),
  })
  .strict();

function validateAttachment(file?: Express.Multer.File) {
  if (!file)
    throw new AppError(422, "ATTACHMENT_REQUIRED", "Anexe o relatório.");

  const lowerName = path.basename(file.originalname).toLowerCase();
  const isXlsx = lowerName.endsWith(".xlsx");
  const isCsv = lowerName.endsWith(".csv");
  if (!isXlsx && !isCsv)
    throw new AppError(
      422,
      "UNSUPPORTED_REPORT_TYPE",
      "O anexo deve ser XLSX ou CSV.",
    );
  if (isXlsx && file.buffer.subarray(0, 2).toString("ascii") !== "PK")
    throw new AppError(
      422,
      "INVALID_XLSX",
      "O conteúdo do arquivo XLSX é inválido.",
    );
  return {
    filename: lowerName.replace(/[^a-z0-9._-]/g, "_").slice(0, 180),
    contentType: isXlsx
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv; charset=utf-8",
  };
}

async function deliverEmail(input: {
  recipients: string[];
  subject: string;
  message: string;
  file: Express.Multer.File;
  filename: string;
  contentType: string;
}) {
  const commonMessage = {
    from: { name: env.EMAIL_FROM_NAME, address: env.EMAIL_FROM },
    to: input.recipients.map((address) => ({ address })),
    subject: input.subject,
    text: input.message,
    attachments: [
      {
        filename: input.filename,
        content: input.file.buffer,
        contentType: input.contentType,
      },
    ],
    disableFileAccess: true,
    disableUrlAccess: true,
  };

  if (env.EMAIL_MODE === "smtp") {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST!,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
          : undefined,
      tls: { rejectUnauthorized: true },
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    const result = await transporter.sendMail(commonMessage);
    return { mode: "smtp" as const, messageId: result.messageId };
  }

  const transporter = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: "unix",
  });
  const result = await transporter.sendMail(commonMessage);
  const outboxRoot = path.resolve(process.cwd(), env.EMAIL_OUTBOX_DIR);
  await mkdir(outboxRoot, { recursive: true });
  const previewFile = `${Date.now()}-${randomUUID()}.eml`;
  const message = result.message;
  if (!Buffer.isBuffer(message) && typeof message !== "string")
    throw new AppError(
      500,
      "EMAIL_PREVIEW_FAILED",
      "Não foi possível gerar a prévia do e-mail.",
    );
  await writeFile(path.join(outboxRoot, previewFile), message, { flag: "wx" });
  return {
    mode: "outbox" as const,
    messageId: result.messageId,
    previewFile,
  };
}

export const reportsAdminRouter = Router();
reportsAdminRouter.use(requireAuth, requireAdmin);
reportsAdminRouter.post(
  "/email",
  sensitiveLimiter,
  receiveReport,
  asyncHandler(async (req, res) => {
    const input = reportSchema.parse(req.body);
    const attachment = validateAttachment(req.file);
    const delivery = await deliverEmail({
      ...input,
      file: req.file!,
      ...attachment,
    });

    await auditRepository.write(
      req.auth!,
      "EMAIL_RESULTS_REPORT",
      "reports",
      delivery.messageId || randomUUID(),
      undefined,
      {
        recipientCount: input.recipients.length,
        attachmentName: attachment.filename,
        attachmentSize: req.file!.size,
        deliveryMode: delivery.mode,
      },
      req.ip,
    );

    res.status(202).json({
      accepted: true,
      ...delivery,
      message:
        delivery.mode === "outbox"
          ? "E-mail gerado na caixa de saída local."
          : "E-mail entregue ao servidor SMTP.",
    });
  }),
);
