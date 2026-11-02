import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { authService } from "./auth.service.js";

const cookieOptions = (expires?: Date) => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax" as const,
  path: `${env.API_PREFIX}/auth`,
  expires,
});

export const authController = {
  login: async (req: Request, res: Response) => {
    const result = await authService.login(
      req.body.employeeNumber,
      req.body.password,
      req.ip,
      req.get("user-agent"),
    );
    res.cookie(
      env.COOKIE_NAME,
      result.refreshToken,
      cookieOptions(result.refreshExpiresAt),
    );
    res.json({ token: result.token, user: result.user });
  },
  refresh: async (req: Request, res: Response) => {
    const result = await authService.refresh(req.cookies?.[env.COOKIE_NAME]);
    res.cookie(
      env.COOKIE_NAME,
      result.refreshToken,
      cookieOptions(result.refreshExpiresAt),
    );
    res.json({ token: result.token, user: result.user });
  },
  logout: async (req: Request, res: Response) => {
    await authService.logout(req.cookies?.[env.COOKIE_NAME]);
    res.clearCookie(env.COOKIE_NAME, cookieOptions());
    res.status(204).send();
  },
  me: async (req: Request, res: Response) =>
    res.json(await authService.me(req.auth!.id)),
  firstAccess: async (req: Request, res: Response) =>
    res.json({
      success: true,
      user: await authService.firstAccess(req.auth!.id, req.body.newPassword),
    }),
  changePassword: async (req: Request, res: Response) => {
    await authService.changePassword(
      req.auth!.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    res.status(204).send();
  },
  acceptRegulation: async (req: Request, res: Response) =>
    res.json({
      success: true,
      user: await authService.acceptRegulation(
        req.auth!.id,
        req.auth!.campaignId,
        req.body.version,
        req.ip,
        req.get("user-agent"),
      ),
    }),
};
