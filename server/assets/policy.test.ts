import { describe, expect, it } from "vitest";
import { ASSET_PURPOSE } from "@/server/assets/constants";
import {
  buildWorkspaceAssetKey,
  getAssetUploadPolicy,
} from "@/server/assets/policy";

describe("asset upload policy", () => {
  it("allows landing page media within size and type limits", () => {
    const policy = getAssetUploadPolicy({
      purpose: ASSET_PURPOSE.LANDING_PAGE_MEDIA,
      contentType: "image/png",
      fileSizeBytes: 1024,
    });

    expect(policy.extension).toBe("png");
    expect(policy.maxSizeBytes).toBe(10 * 1024 * 1024);
  });

  it("rejects unsupported content types", () => {
    expect(() =>
      getAssetUploadPolicy({
        purpose: ASSET_PURPOSE.LANDING_PAGE_MEDIA,
        contentType: "text/html",
        fileSizeBytes: 1024,
      })
    ).toThrow("This file type is not supported.");
  });

  it("builds workspace-scoped keys without raw filenames", () => {
    const key = buildWorkspaceAssetKey({
      workspaceId: "workspace_123",
      landingPageId: "landing_123",
      assetId: "asset_123",
      purpose: ASSET_PURPOSE.LANDING_PAGE_MEDIA,
      contentType: "application/pdf",
    });

    expect(key).toBe(
      "workspaces/workspace_123/landing-pages/landing_123/media/asset_123.pdf"
    );
    expect(key).not.toContain("brochure");
  });

  it("supports unassigned landing page uploads for create-first asset workflows", () => {
    const key = buildWorkspaceAssetKey({
      workspaceId: "workspace_123",
      assetId: "asset_123",
      purpose: ASSET_PURPOSE.LANDING_PAGE_MEDIA,
      contentType: "image/webp",
    });

    expect(key).toBe(
      "workspaces/workspace_123/landing-pages/unassigned/media/asset_123.webp"
    );
  });
});
