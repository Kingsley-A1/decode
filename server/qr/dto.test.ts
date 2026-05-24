import { describe, expect, it } from "vitest";
import { QR_CODE_MODE, QR_CODE_STATUS, QR_CODE_TYPE } from "@/server/qr/constants";
import { toQRCodeDetail, toQRCodeListItem } from "@/server/qr/dto";
import type {
  QRCodeDashboardRecord,
  QRCodeDetailRecord,
} from "@/server/qr/selectors";

describe("QR code DTOs", () => {
  it("exposes dynamic redirect URLs without placeholder payloads", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://decode.example";
    const record = getDashboardRecord({
      mode: QR_CODE_MODE.DYNAMIC,
      slug: "spring-campaign",
      destinationUrl: "https://brand.example/",
    });

    expect(toQRCodeListItem(record)).toMatchObject({
      redirectUrl: "https://decode.example/r/spring-campaign",
    });
    expect(JSON.stringify(toQRCodeListItem(record))).not.toContain(
      "assigned-after-publish"
    );
  });

  it("exposes saved payload value and parsed design on detail responses", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://decode.example";
    const record: QRCodeDetailRecord = {
      ...getDashboardRecord({
        mode: QR_CODE_MODE.DYNAMIC,
        slug: "spring-campaign",
        destinationUrl: "https://brand.example/",
      }),
      payload: {
        type: QR_CODE_TYPE.URL,
        value: "https://decode.example/r/spring-campaign",
        content: { url: "https://brand.example/" },
      },
      designConfig: {
        foregroundColor: "#0F172A",
        backgroundColor: "#FFFFFF",
        margin: 16,
        logoSizeRatio: 0,
        dotStyle: "square",
        cornerStyle: "square",
        errorCorrectionLevel: "Q",
        size: 1024,
      },
    };

    expect(toQRCodeDetail(record)).toMatchObject({
      payloadValue: "https://decode.example/r/spring-campaign",
      redirectUrl: "https://decode.example/r/spring-campaign",
      designConfig: {
        foregroundColor: "#0F172A",
        size: 1024,
      },
    });
  });
});

function getDashboardRecord(
  overrides: Partial<QRCodeDashboardRecord> = {}
): QRCodeDashboardRecord {
  const now = new Date("2026-05-24T00:00:00.000Z");

  return {
    id: "qr_123",
    workspaceId: "workspace_123",
    ownerId: "user_123",
    title: "Spring Campaign",
    type: QR_CODE_TYPE.URL,
    mode: QR_CODE_MODE.STATIC,
    status: QR_CODE_STATUS.PUBLISHED,
    slug: null,
    destinationUrl: null,
    scanCount: 0,
    publishedAt: now,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    landingPage: null,
    ...overrides,
  };
}
