import "server-only";

import type { Prisma } from "@prisma/client";
import {
  ADMIN_AUTH_OUTCOME,
  type AdminAuthEvent,
  type AdminAuthOutcome,
  type PlatformAuditAction,
  type PlatformEntityType,
} from "@/server/admin/constants";
import type { AdminRequestTelemetry } from "@/server/admin/telemetry";
import { prisma } from "@/server/db/prisma";

export interface WriteAdminAuthEventInput {
  readonly adminUserId?: string;
  readonly email: string;
  readonly event: AdminAuthEvent;
  readonly outcome: AdminAuthOutcome;
  readonly reason?: string;
  readonly requestId: string;
  readonly telemetry: AdminRequestTelemetry;
}

export interface WritePlatformAuditLogInput {
  readonly actorAdminUserId?: string;
  readonly action: PlatformAuditAction;
  readonly entityType: PlatformEntityType;
  readonly entityId?: string;
  readonly requestId?: string;
  readonly metadata?: Prisma.InputJsonValue;
  readonly telemetry?: AdminRequestTelemetry;
}

export function writeAdminAuthEvent(
  input: WriteAdminAuthEventInput,
  client: Pick<Prisma.TransactionClient, "adminAuthEvent"> = prisma
) {
  return client.adminAuthEvent.create({
    data: {
      email: input.email,
      event: input.event,
      outcome: input.outcome,
      requestId: input.requestId,
      reason: input.reason,
      ipHash: input.telemetry.ipHash,
      userAgentHash: input.telemetry.userAgentHash,
      ...(input.adminUserId ? { adminUserId: input.adminUserId } : {}),
    },
    select: { id: true },
  });
}

export function writePlatformAuditLog(
  input: WritePlatformAuditLogInput,
  client: Pick<Prisma.TransactionClient, "platformAuditLog"> = prisma
) {
  return client.platformAuditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      requestId: input.requestId,
      metadata: input.metadata,
      ipHash: input.telemetry?.ipHash,
      userAgentHash: input.telemetry?.userAgentHash,
      ...(input.actorAdminUserId
        ? { actorAdminUserId: input.actorAdminUserId }
        : {}),
    },
    select: { id: true },
  });
}

export async function countRecentFailedAuthEvents({
  email,
  ipHash,
  since,
}: {
  readonly email: string;
  readonly ipHash: string | null;
  readonly since: Date;
}): Promise<number> {
  return prisma.adminAuthEvent.count({
    where: {
      outcome: ADMIN_AUTH_OUTCOME.FAILURE,
      createdAt: { gte: since },
      OR: [
        { email },
        ...(ipHash ? [{ ipHash }] : []),
      ],
    },
  });
}
