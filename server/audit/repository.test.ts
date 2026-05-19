import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE } from "@/server/audit/constants";
import {
  createAuditLog,
  type AuditLogRecord,
  type AuditLogRepositoryClient,
} from "@/server/audit/repository";

describe("createAuditLog", () => {
  it("writes a workspace-scoped audit event with actor and metadata", async () => {
    const create = vi.fn(createAuditLogMock);
    const client: AuditLogRepositoryClient = {
      auditLog: {
        create,
        findMany: vi.fn(),
      },
    };

    await createAuditLog(
      {
        workspaceId: "workspace_123",
        actorUserId: "user_123",
        action: AUDIT_ACTION.DESTINATION_CHANGE,
        entityType: AUDIT_ENTITY_TYPE.QR_CODE,
        entityId: "qr_123",
        metadata: { previousUrl: "https://old.test", nextUrl: "https://new.test" },
      },
      client
    );

    expect(create).toHaveBeenCalledWith({
      data: {
        workspaceId: "workspace_123",
        actorUserId: "user_123",
        action: AUDIT_ACTION.DESTINATION_CHANGE,
        entityType: AUDIT_ENTITY_TYPE.QR_CODE,
        entityId: "qr_123",
        metadata: {
          previousUrl: "https://old.test",
          nextUrl: "https://new.test",
        },
      },
    });
  });
});

async function createAuditLogMock(
  args: Prisma.AuditLogCreateArgs
): Promise<AuditLogRecord> {
  const data = args.data as Prisma.AuditLogUncheckedCreateInput;

  return {
    id: "audit_123",
    workspaceId: data.workspaceId,
    actorUserId: data.actorUserId ?? null,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    metadata: getStoredMetadata(data.metadata),
    createdAt: new Date("2026-05-18T00:00:00.000Z"),
  };
}

function getStoredMetadata(
  metadata: Prisma.AuditLogUncheckedCreateInput["metadata"]
): Prisma.JsonValue | null {
  if (metadata === undefined || metadata === Prisma.DbNull) return null;

  return metadata as Prisma.JsonValue;
}
