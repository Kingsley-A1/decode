import { describe, expect, it } from "vitest";
import { getWorkspaceScanWhere } from "@/server/dashboard/queries";

describe("dashboard query filters", () => {
  it("scopes scan analytics to a QR code when requested", () => {
    expect(
      getWorkspaceScanWhere({
        workspaceId: "workspace_123",
        qrCodeId: "qr_123",
      })
    ).toMatchObject({
      workspaceId: "workspace_123",
      qrCodeId: "qr_123",
      workspace: { deletedAt: null },
      qrCode: { deletedAt: null },
    });
  });
});
