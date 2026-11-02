import { Router } from "express";
import { asyncHandler, validate } from "../../shared/http.js";
import { requireAuth } from "../../middlewares/auth.js";
import { loginLimiter } from "../../middlewares/security.js";
import {
  acceptRegulationSchema,
  changePasswordSchema,
  firstAccessSchema,
  loginSchema,
} from "./auth.schemas.js";
import { authController } from "./auth.controller.js";

export const authRouter = Router();
authRouter.post(
  "/login",
  loginLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);
authRouter.post("/refresh", loginLimiter, asyncHandler(authController.refresh));
authRouter.post("/logout", asyncHandler(authController.logout));
authRouter.get("/me", requireAuth, asyncHandler(authController.me));
authRouter.post(
  "/first-access",
  requireAuth,
  validate({ body: firstAccessSchema }),
  asyncHandler(authController.firstAccess),
);
authRouter.post(
  "/change-password",
  requireAuth,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword),
);
authRouter.post(
  "/accept-regulation",
  requireAuth,
  validate({ body: acceptRegulationSchema }),
  asyncHandler(authController.acceptRegulation),
);
