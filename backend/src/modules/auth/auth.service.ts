import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError, forbidden } from "../../shared/errors.js";
import { hashIp, randomToken, sha256 } from "../../shared/security.js";
import { authRepository, type UserRow } from "./auth.repository.js";
import type { AuthUser } from "./auth.types.js";

export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    employeeNumber: user.employee_number,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    displayName: user.display_name,
    description: user.description ?? undefined,
    role: user.role,
    unitId: user.unit_id ?? undefined,
    unitSlug: user.unit_slug ?? undefined,
    unitNameBackup: user.unit_name ?? undefined,
    company: user.company_name ?? undefined,
    adminComment: user.admin_comment ?? undefined,
    mustChangePassword: Boolean(user.must_change_password),
    regulationAcceptedVersion: user.regulation_version ?? undefined,
    regulationAcceptedAt: user.regulation_accepted_at?.toISOString(),
    active: Boolean(user.active),
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at.toISOString(),
  };
}

function authPayload(user: UserRow): AuthUser {
  return {
    id: user.id,
    organizationId: user.organization_id,
    campaignId: user.campaign_id,
    role: user.role,
    employeeNumber: user.employee_number,
    displayName: user.display_name,
  };
}

function accessToken(user: UserRow): string {
  return jwt.sign({ ...authPayload(user) }, env.JWT_ACCESS_SECRET, {
    subject: user.id,
    issuer: "sipat-api",
    audience: "sipat-web",
    expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"],
  });
}

function refreshExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
}

export class AuthService {
  async login(
    employeeNumber: string,
    password: string,
    ip?: string,
    userAgent = "",
  ) {
    const user = await authRepository.findByEmployeeNumber(employeeNumber);
    const valid = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;
    if (!user || !valid || !user.active) {
      await authRepository.logAccess(
        user,
        employeeNumber,
        "failure",
        "Credenciais inválidas ou usuário inativo",
        hashIp(ip),
        userAgent,
      );
      throw new AppError(
        401,
        "UNAUTHENTICATED",
        "Matrícula ou senha inválida.",
      );
    }
    const refreshToken = randomToken();
    const expiresAt = refreshExpiry();
    await Promise.all([
      authRepository.createRefreshToken(
        user.id,
        sha256(refreshToken),
        expiresAt,
      ),
      authRepository.updateLastLogin(user.id),
      authRepository.logAccess(
        user,
        employeeNumber,
        "success",
        null,
        hashIp(ip),
        userAgent,
      ),
    ]);
    return {
      token: accessToken(user),
      refreshToken,
      refreshExpiresAt: expiresAt,
      user: toPublicUser(user),
    };
  }

  async refresh(rawToken?: string) {
    if (!rawToken)
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Sessão expirada.");
    const replacement = randomToken();
    const expiresAt = refreshExpiry();
    const user = await authRepository.rotateRefreshToken(
      sha256(rawToken),
      sha256(replacement),
      expiresAt,
    );
    if (!user || !user.active)
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Sessão expirada.");
    return {
      token: accessToken(user),
      refreshToken: replacement,
      refreshExpiresAt: expiresAt,
      user: toPublicUser(user),
    };
  }

  async me(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user || !user.active)
      throw new AppError(401, "UNAUTHENTICATED", "Sessão inválida.");
    return toPublicUser(user);
  }

  async firstAccess(userId: string, newPassword: string) {
    const user = await authRepository.findById(userId);
    if (!user || !user.active) throw forbidden();
    if (!user.must_change_password)
      throw new AppError(
        409,
        "FIRST_ACCESS_ALREADY_COMPLETED",
        "O primeiro acesso já foi concluído.",
      );
    const passwordHash = await bcrypt.hash(
      newPassword,
      env.PASSWORD_BCRYPT_ROUNDS,
    );
    await authRepository.updatePassword(userId, passwordHash);
    return this.me(userId);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await authRepository.findById(userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash)))
      throw new AppError(401, "INVALID_PASSWORD", "Senha atual inválida.");
    await authRepository.updatePassword(
      userId,
      await bcrypt.hash(newPassword, env.PASSWORD_BCRYPT_ROUNDS),
    );
  }

  async acceptRegulation(
    userId: string,
    campaignId: string,
    version: string,
    ip?: string,
    userAgent = "",
  ) {
    const regulation = await authRepository.currentRegulation(
      campaignId,
      version,
    );
    if (!regulation)
      throw new AppError(
        422,
        "INVALID_REGULATION",
        "Regulamento inválido ou não publicado.",
      );
    await authRepository.acceptRegulation(
      regulation.id,
      userId,
      hashIp(ip),
      userAgent,
    );
    return this.me(userId);
  }

  async logout(rawToken?: string) {
    if (rawToken) await authRepository.revokeRefreshToken(sha256(rawToken));
  }
}

export const authService = new AuthService();
