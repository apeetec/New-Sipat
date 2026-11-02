import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError, forbidden } from "../shared/errors.js";
import type { AuthUser } from "../modules/auth/auth.types.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token)
    return next(
      new AppError(401, "UNAUTHENTICATED", "Autenticação necessária."),
    );
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: "sipat-api",
      audience: "sipat-web",
    }) as AuthUser;
    req.auth = payload;
    next();
  } catch {
    next(new AppError(401, "INVALID_TOKEN", "Token inválido ou expirado."));
  }
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.auth?.role !== "admin")
    return next(forbidden("Acesso restrito a administradores."));
  next();
};
