import "server-only";

import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import {
  ADMIN_AUTH_EVENT,
  ADMIN_AUTH_MAX_ATTEMPTS,
  ADMIN_AUTH_OUTCOME,
  ADMIN_AUTH_WINDOW_MS,
  ADMIN_ROLE,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_MS,
  ADMIN_STATUS,
  PLATFORM_AUDIT_ACTION,
  PLATFORM_ENTITY_TYPE,
  type AdminRole,
} from "@/server/admin/constants";
import {
  countRecentFailedAuthEvents,
  writeAdminAuthEvent,
  writePlatformAuditLog,
} from "@/server/admin/audit";
import {
  createAdminSessionToken,
  hashAdminSecret,
  hashAdminSessionToken,
  verifyAdminSecret,
} from "@/server/admin/crypto";
import { AdminAccessError, AdminAuthError } from "@/server/admin/errors";
import type {
  AdminLoginRequest,
  AdminRegisterRequest,
} from "@/server/admin/schemas";
import {
  getAdminRequestTelemetry,
  type AdminRequestTelemetry,
} from "@/server/admin/telemetry";
import { prisma } from "@/server/db/prisma";

export interface AdminSessionUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: AdminRole;
  readonly status: string;
}

export interface AdminSessionResult {
  readonly token: string;
  readonly expiresAt: Date;
  readonly admin: AdminSessionUser;
}

export async function registerAdmin({
  request,
  requestId,
  input,
}: {
  readonly request: Request;
  readonly requestId: string;
  readonly input: AdminRegisterRequest;
}): Promise<AdminSessionResult> {
  const telemetry = getAdminRequestTelemetry(request);
  await enforceAdminAuthThrottle(input.email, telemetry);
  await assertValidRegistrationCode(input, requestId, telemetry);

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingAdmin) {
    await writeAdminAuthEvent({
      email: input.email,
      event: ADMIN_AUTH_EVENT.REGISTER,
      outcome: ADMIN_AUTH_OUTCOME.FAILURE,
      reason: "email_exists",
      requestId,
      telemetry,
    });
    throw new AdminAuthError(
      "ADMIN_EMAIL_EXISTS",
      "An admin account already exists for this email.",
      409
    );
  }

  const passwordHash = await hashAdminSecret(input.password);
  const sessionToken = createAdminSessionToken();
  const expiresAt = getSessionExpiry();

  return prisma.$transaction(async (transaction) => {
    const adminCount = await transaction.adminUser.count();
    const role = adminCount === 0 ? ADMIN_ROLE.OWNER : ADMIN_ROLE.ADMIN;
    const admin = await transaction.adminUser.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role,
        status: ADMIN_STATUS.ACTIVE,
        lastLoginAt: new Date(),
      },
      select: adminSessionUserSelect,
    });

    await createAdminSessionRecord({
      adminUserId: admin.id,
      sessionToken,
      expiresAt,
      telemetry,
      transaction,
    });
    await writeAdminAuthEvent(
      {
        adminUserId: admin.id,
        email: admin.email,
        event: ADMIN_AUTH_EVENT.REGISTER,
        outcome: ADMIN_AUTH_OUTCOME.SUCCESS,
        requestId,
        telemetry,
      },
      transaction
    );
    await writePlatformAuditLog(
      {
        actorAdminUserId: admin.id,
        action: PLATFORM_AUDIT_ACTION.ADMIN_REGISTER,
        entityType: PLATFORM_ENTITY_TYPE.ADMIN_USER,
        entityId: admin.id,
        requestId,
        metadata: { role },
        telemetry,
      },
      transaction
    );

    return { token: sessionToken, expiresAt, admin: toSessionUser(admin) };
  });
}

export async function loginAdmin({
  request,
  requestId,
  input,
}: {
  readonly request: Request;
  readonly requestId: string;
  readonly input: AdminLoginRequest;
}): Promise<AdminSessionResult> {
  const telemetry = getAdminRequestTelemetry(request);
  await enforceAdminAuthThrottle(input.email, telemetry);

  const admin = await prisma.adminUser.findUnique({
    where: { email: input.email },
    select: { ...adminSessionUserSelect, passwordHash: true, disabledAt: true },
  });
  const isValidPassword = admin
    ? await verifyAdminSecret({ value: input.password, hash: admin.passwordHash })
    : false;
  const canLogin = Boolean(
    admin && admin.status === ADMIN_STATUS.ACTIVE && admin.disabledAt === null
  );

  if (!admin || !isValidPassword || !canLogin) {
    await writeAdminAuthEvent({
      adminUserId: admin?.id,
      email: input.email,
      event: ADMIN_AUTH_EVENT.LOGIN,
      outcome: ADMIN_AUTH_OUTCOME.FAILURE,
      reason: getLoginFailureReason(admin, isValidPassword),
      requestId,
      telemetry,
    });
    throw new AdminAuthError(
      "ADMIN_LOGIN_FAILED",
      "Email or password is incorrect, or this admin account is disabled.",
      401
    );
  }

  const sessionToken = createAdminSessionToken();
  const expiresAt = getSessionExpiry();

  await prisma.$transaction(async (transaction) => {
    await transaction.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
      select: { id: true },
    });
    await createAdminSessionRecord({
      adminUserId: admin.id,
      sessionToken,
      expiresAt,
      telemetry,
      transaction,
    });
    await writeAdminAuthEvent(
      {
        adminUserId: admin.id,
        email: admin.email,
        event: ADMIN_AUTH_EVENT.LOGIN,
        outcome: ADMIN_AUTH_OUTCOME.SUCCESS,
        requestId,
        telemetry,
      },
      transaction
    );
    await writePlatformAuditLog(
      {
        actorAdminUserId: admin.id,
        action: PLATFORM_AUDIT_ACTION.ADMIN_LOGIN,
        entityType: PLATFORM_ENTITY_TYPE.ADMIN_USER,
        entityId: admin.id,
        requestId,
        telemetry,
      },
      transaction
    );
  });

  return { token: sessionToken, expiresAt, admin: toSessionUser(admin) };
}

export async function logoutAdmin({
  request,
  requestId,
}: {
  readonly request: Request;
  readonly requestId: string;
}): Promise<void> {
  const telemetry = getAdminRequestTelemetry(request);
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return;

  const sessionTokenHash = hashAdminSessionToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { sessionTokenHash },
    select: { id: true, adminUserId: true, adminUser: { select: { email: true } } },
  });

  if (!session) return;

  await prisma.$transaction(async (transaction) => {
    await transaction.adminSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
      select: { id: true },
    });
    await writeAdminAuthEvent(
      {
        adminUserId: session.adminUserId,
        email: session.adminUser.email,
        event: ADMIN_AUTH_EVENT.LOGOUT,
        outcome: ADMIN_AUTH_OUTCOME.SUCCESS,
        requestId,
        telemetry,
      },
      transaction
    );
    await writePlatformAuditLog(
      {
        actorAdminUserId: session.adminUserId,
        action: PLATFORM_AUDIT_ACTION.ADMIN_LOGOUT,
        entityType: PLATFORM_ENTITY_TYPE.ADMIN_SESSION,
        entityId: session.id,
        requestId,
        telemetry,
      },
      transaction
    );
  });
}

export async function getOptionalAdminSession(): Promise<AdminSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const sessionTokenHash = hashAdminSessionToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { sessionTokenHash },
    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,
      adminUser: { select: adminSessionUserSelect },
    },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  if (
    session.adminUser.status !== ADMIN_STATUS.ACTIVE ||
    !isAdminRole(session.adminUser.role)
  ) {
    return null;
  }

  await prisma.adminSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
    select: { id: true },
  });

  return { ...session.adminUser, role: session.adminUser.role as AdminRole };
}

export async function getRequiredAdminSession(): Promise<AdminSessionUser> {
  const admin = await getOptionalAdminSession();

  if (!admin) {
    throw new AdminAccessError(
      "ADMIN_UNAUTHENTICATED",
      "Sign in with admin credentials before accessing the admin console.",
      401
    );
  }

  return admin;
}

export function assertAdminOwner(admin: AdminSessionUser): void {
  if (admin.role !== ADMIN_ROLE.OWNER) {
    throw new AdminAccessError(
      "ADMIN_OWNER_REQUIRED",
      "Only owner admins can perform this operation.",
      403
    );
  }
}

const adminSessionUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
} satisfies Prisma.AdminUserSelect;

async function assertValidRegistrationCode(
  input: AdminRegisterRequest,
  requestId: string,
  telemetry: AdminRequestTelemetry
): Promise<void> {
  const registrationCodeHash = process.env.ADMIN_REGISTRATION_CODE_HASH;
  if (!registrationCodeHash) {
    await writeAdminAuthEvent({
      email: input.email,
      event: ADMIN_AUTH_EVENT.REGISTER,
      outcome: ADMIN_AUTH_OUTCOME.FAILURE,
      reason: "registration_code_not_configured",
      requestId,
      telemetry,
    });
    throw new AdminAuthError(
      "ADMIN_REGISTRATION_NOT_CONFIGURED",
      "Admin registration is not configured for this environment.",
      503
    );
  }

  const isValidCode = await verifyAdminSecret({
    value: input.registrationCode,
    hash: registrationCodeHash,
  });

  if (!isValidCode) {
    await writeAdminAuthEvent({
      email: input.email,
      event: ADMIN_AUTH_EVENT.REGISTER,
      outcome: ADMIN_AUTH_OUTCOME.FAILURE,
      reason: "invalid_registration_code",
      requestId,
      telemetry,
    });
    throw new AdminAuthError(
      "ADMIN_REGISTRATION_CODE_INVALID",
      "The admin registration code is invalid.",
      403
    );
  }
}

async function enforceAdminAuthThrottle(
  email: string,
  telemetry: AdminRequestTelemetry
): Promise<void> {
  const since = new Date(Date.now() - ADMIN_AUTH_WINDOW_MS);
  const failedAttempts = await countRecentFailedAuthEvents({
    email,
    ipHash: telemetry.ipHash,
    since,
  });

  if (failedAttempts >= ADMIN_AUTH_MAX_ATTEMPTS) {
    throw new AdminAuthError(
      "ADMIN_AUTH_RATE_LIMITED",
      "Too many failed admin authentication attempts. Try again later.",
      429
    );
  }
}

async function createAdminSessionRecord({
  adminUserId,
  sessionToken,
  expiresAt,
  telemetry,
  transaction,
}: {
  readonly adminUserId: string;
  readonly sessionToken: string;
  readonly expiresAt: Date;
  readonly telemetry: AdminRequestTelemetry;
  readonly transaction: Prisma.TransactionClient;
}): Promise<void> {
  await transaction.adminSession.create({
    data: {
      adminUserId,
      sessionTokenHash: hashAdminSessionToken(sessionToken),
      expiresAt,
      ipHash: telemetry.ipHash,
      userAgentHash: telemetry.userAgentHash,
    },
    select: { id: true },
  });
}

function getSessionExpiry(): Date {
  return new Date(Date.now() + ADMIN_SESSION_TTL_MS);
}

function getLoginFailureReason(
  admin: ({ status: string; disabledAt: Date | null } & { id: string }) | null,
  isValidPassword: boolean
): string {
  if (!admin) return "not_found";
  if (!isValidPassword) return "invalid_password";
  if (admin.status !== ADMIN_STATUS.ACTIVE || admin.disabledAt) {
    return "disabled";
  }

  return "unknown";
}

function toSessionUser(admin: {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly status: string;
}): AdminSessionUser {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role as AdminRole,
    status: admin.status,
  };
}

function isAdminRole(value: string): value is AdminRole {
  return value === ADMIN_ROLE.OWNER || value === ADMIN_ROLE.ADMIN;
}
