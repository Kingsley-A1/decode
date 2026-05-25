import type { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE } from "@/server/audit/constants";
import {
  QR_CODE_MODE,
  QR_CODE_STATUS,
  QR_CODE_TYPE,
} from "@/server/qr/constants";
import {
  archiveQRCodeInWorkspace,
  prepareQRCode,
  updateDynamicQRCodeDestinationInWorkspace,
  updateQRCodeInWorkspace,
  type ArchiveQRCodeClient,
  type ArchiveQRCodeTransactionClient,
  type DynamicDestinationClient,
  type DynamicDestinationTransactionClient,
} from "@/server/qr/service";
import { createQRCodeRequestSchema } from "@/server/qr/schemas";

describe("dynamic QR service", () => {
  it("encodes the stable Decode redirect URL and preserves the editable destination", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://decode.example";
    const request = createQRCodeRequestSchema.parse({
      mode: QR_CODE_MODE.DYNAMIC,
      save: true,
      slug: "Spring-Campaign",
      type: QR_CODE_TYPE.URL,
      content: { url: "brand.example/promo" },
    });

    const preparedQRCode = prepareQRCode(request);

    expect(preparedQRCode.payload.value).toBe(
      "https://decode.example/r/spring-campaign"
    );
    expect(preparedQRCode.payload.destinationUrl).toBe(
      "https://brand.example/promo"
    );
  });

  it("accepts dynamic creation without a user-entered slug and prepares with the assigned slug", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://decode.example";
    const request = createQRCodeRequestSchema.parse({
      mode: QR_CODE_MODE.DYNAMIC,
      save: true,
      type: QR_CODE_TYPE.URL,
      content: { url: "https://brand.example/promo" },
    });

    const preparedQRCode = prepareQRCode(request, {
      dynamicSlug: "qr-generated123",
    });

    expect(request.slug).toBeUndefined();
    expect(preparedQRCode.payload.value).toBe(
      "https://decode.example/r/qr-generated123"
    );
    expect(preparedQRCode.payload.destinationUrl).toBe(
      "https://brand.example/promo"
    );
  });

  it("updates destination without changing the stored QR redirect value and writes an audit log", async () => {
    const createdAt = new Date("2026-05-18T00:00:00.000Z");
    const updatedAt = new Date("2026-05-18T01:00:00.000Z");
    const payload = {
      type: QR_CODE_TYPE.URL,
      value: "https://decode.example/r/spring-campaign",
      content: { url: "https://old.example/" },
    };
    const record = {
      id: "qr_123",
      workspaceId: "workspace_123",
      ownerId: "user_123",
      title: "Spring Campaign",
      type: QR_CODE_TYPE.URL,
      mode: QR_CODE_MODE.DYNAMIC,
      status: QR_CODE_STATUS.PUBLISHED,
      slug: "spring-campaign",
      destinationUrl: "https://old.example/",
      scanCount: 12,
      publishedAt: createdAt,
      archivedAt: null,
      createdAt,
      updatedAt: createdAt,
      payload,
      landingPage: null,
    };
    const findFirst = vi.fn(async () => record);
    const update = vi.fn(async (args: Prisma.QRCodeUpdateArgs) => {
      const data = args.data as Prisma.QRCodeUncheckedUpdateInput;

      return {
        ...record,
        destinationUrl: data.destinationUrl as string,
        payload: data.payload as Prisma.JsonValue,
        updatedAt,
      };
    });
    const create = vi.fn(async (args: Prisma.AuditLogCreateArgs) => args);
    const client: DynamicDestinationClient = {
      $transaction: async (callback) =>
        callback({
          qRCode: { findFirst, update },
          auditLog: { create },
        } as DynamicDestinationTransactionClient),
    };

    const result = await updateDynamicQRCodeDestinationInWorkspace(
      {
        qrCodeId: "qr_123",
        workspaceId: "workspace_123",
        userId: "user_123",
        destinationUrl: "https://new.example/",
      },
      client
    );

    const updateData = update.mock.calls[0]?.[0].data as
      | Prisma.QRCodeUncheckedUpdateInput
      | undefined;
    const updatedPayload = updateData?.payload as
      | Record<string, unknown>
      | undefined;
    const updatedContent = updatedPayload?.content as
      | Record<string, unknown>
      | undefined;

    expect(result.qrCode.destinationUrl).toBe("https://new.example/");
    expect(updatedPayload?.value).toBe("https://decode.example/r/spring-campaign");
    expect(updatedContent?.url).toBe("https://new.example/");
    expect(create).toHaveBeenCalledWith({
      data: {
        workspaceId: "workspace_123",
        actorUserId: "user_123",
        action: AUDIT_ACTION.DESTINATION_CHANGE,
        entityType: AUDIT_ENTITY_TYPE.QR_CODE,
        entityId: "qr_123",
        metadata: {
          previousUrl: "https://old.example/",
          nextUrl: "https://new.example/",
          slug: "spring-campaign",
        },
      },
    });
  });

  it("renames a QR code and writes an update audit log", async () => {
    const createdAt = new Date("2026-05-18T00:00:00.000Z");
    const payload = {
      type: QR_CODE_TYPE.URL,
      value: "https://decode.example/r/spring-campaign",
      content: { url: "https://old.example/" },
    };
    const record = {
      id: "qr_rename",
      workspaceId: "workspace_123",
      ownerId: "user_123",
      title: "Old Title",
      type: QR_CODE_TYPE.URL,
      mode: QR_CODE_MODE.DYNAMIC,
      status: QR_CODE_STATUS.PUBLISHED,
      slug: "spring-campaign",
      destinationUrl: "https://old.example/",
      scanCount: 0,
      publishedAt: createdAt,
      archivedAt: null,
      createdAt,
      updatedAt: createdAt,
      payload,
      landingPage: null,
    };
    const findFirst = vi.fn(async () => record);
    const update = vi.fn(async (args: Prisma.QRCodeUpdateArgs) => ({
      ...record,
      ...(args.data as Prisma.QRCodeUncheckedUpdateInput),
    }));
    const create = vi.fn(async (args: Prisma.AuditLogCreateArgs) => args);
    const client: DynamicDestinationClient = {
      $transaction: async (callback) =>
        callback({
          qRCode: { findFirst, update },
          auditLog: { create },
        } as DynamicDestinationTransactionClient),
    };

    const result = await updateQRCodeInWorkspace(
      {
        qrCodeId: "qr_rename",
        workspaceId: "workspace_123",
        userId: "user_123",
        title: "New Title",
      },
      client
    );

    const updateData = update.mock.calls[0]?.[0].data as
      | Prisma.QRCodeUncheckedUpdateInput
      | undefined;

    expect(updateData?.title).toBe("New Title");
    expect(updateData?.destinationUrl).toBeUndefined();
    expect(result.qrCode.title).toBe("New Title");
    expect(create).toHaveBeenCalledWith({
      data: {
        workspaceId: "workspace_123",
        actorUserId: "user_123",
        action: AUDIT_ACTION.UPDATE,
        entityType: AUDIT_ENTITY_TYPE.QR_CODE,
        entityId: "qr_rename",
        metadata: { previousTitle: "Old Title", nextTitle: "New Title" },
      },
    });
  });

  it("archives QR codes and writes an audit log", async () => {
    const createdAt = new Date("2026-05-18T00:00:00.000Z");
    const archivedAt = new Date("2026-05-18T01:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(archivedAt);

    const record = {
      id: "qr_archive",
      workspaceId: "workspace_123",
      ownerId: "user_123",
      title: "Archive me",
      type: QR_CODE_TYPE.URL,
      mode: QR_CODE_MODE.DYNAMIC,
      status: QR_CODE_STATUS.PUBLISHED,
      slug: "archive-me",
      destinationUrl: "https://old.example/",
      scanCount: 0,
      publishedAt: createdAt,
      archivedAt: null,
      createdAt,
      updatedAt: createdAt,
      landingPage: null,
    };
    const findFirst = vi.fn(async () => record);
    const update = vi.fn(async (args: Prisma.QRCodeUpdateArgs) => ({
      ...record,
      ...(args.data as Prisma.QRCodeUncheckedUpdateInput),
      updatedAt: archivedAt,
    }));
    const create = vi.fn(async (args: Prisma.AuditLogCreateArgs) => args);
    const client: ArchiveQRCodeClient = {
      $transaction: async (callback) =>
        callback({
          qRCode: { findFirst, update },
          auditLog: { create },
        } as ArchiveQRCodeTransactionClient),
    };

    const result = await archiveQRCodeInWorkspace(
      {
        qrCodeId: "qr_archive",
        workspaceId: "workspace_123",
        userId: "user_123",
      },
      client
    );

    expect(result.status).toBe(QR_CODE_STATUS.ARCHIVED);
    expect(result.archivedAt).toEqual(archivedAt);
    expect(create).toHaveBeenCalledWith({
      data: {
        workspaceId: "workspace_123",
        actorUserId: "user_123",
        action: AUDIT_ACTION.ARCHIVE,
        entityType: AUDIT_ENTITY_TYPE.QR_CODE,
        entityId: "qr_archive",
        metadata: {
          previousStatus: QR_CODE_STATUS.PUBLISHED,
          slug: "archive-me",
        },
      },
    });

    vi.useRealTimers();
  });
});
