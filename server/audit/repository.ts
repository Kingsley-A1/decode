import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type { AuditAction, AuditEntityType } from "@/server/audit/constants";

export type AuditLogRecord = Prisma.AuditLogGetPayload<Record<string, never>>;

export interface AuditLogRepositoryClient {
  auditLog: {
    create(args: Prisma.AuditLogCreateArgs): Promise<AuditLogRecord>;
    findMany(args: Prisma.AuditLogFindManyArgs): Promise<AuditLogRecord[]>;
  };
}

export interface CreateAuditLogInput {
  readonly workspaceId: string;
  readonly actorUserId?: string;
  readonly action: AuditAction;
  readonly entityType: AuditEntityType;
  readonly entityId: string;
  readonly metadata?: Prisma.InputJsonValue;
}

export interface ListAuditLogsForEntityInput {
  readonly workspaceId: string;
  readonly entityType: AuditEntityType;
  readonly entityId: string;
  readonly take?: number;
}

export function createAuditLog(
  input: CreateAuditLogInput,
  client: AuditLogRepositoryClient = prisma
): Promise<AuditLogRecord> {
  return client.auditLog.create({ data: getAuditLogCreateData(input) });
}

export function listAuditLogsForEntity(
  input: ListAuditLogsForEntityInput,
  client: AuditLogRepositoryClient = prisma
): Promise<AuditLogRecord[]> {
  return client.auditLog.findMany({
    where: {
      workspaceId: input.workspaceId,
      entityType: input.entityType,
      entityId: input.entityId,
    },
    orderBy: { createdAt: "desc" },
    take: input.take ?? 25,
  });
}

function getAuditLogCreateData(
  input: CreateAuditLogInput
): Prisma.AuditLogUncheckedCreateInput {
  return {
    workspaceId: input.workspaceId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
    ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
  };
}
