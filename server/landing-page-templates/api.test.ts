import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLandingPageTemplatePresets } from "@/components/landing-pages/landing-page-data";

const mocks = vi.hoisted(() => {
  const admin = {
    id: "admin_123",
    name: "Admin User",
    email: "admin@decode.test",
    role: "owner",
    status: "active",
  };

  return {
    admin,
    assertAdminSameOrigin: vi.fn(),
    getAdminLandingPageTemplate: vi.fn(),
    getAdminRequestTelemetry: vi.fn(() => ({
      ipHash: "ip_hash",
      userAgentHash: "ua_hash",
    })),
    getRequiredAdminSession: vi.fn(async () => admin),
    listAdminLandingPageTemplates: vi.fn(),
    createAdminLandingPageTemplate: vi.fn(),
    updateAdminLandingPageTemplate: vi.fn(),
  };
});

vi.mock("@/server/admin/auth", () => ({
  getRequiredAdminSession: mocks.getRequiredAdminSession,
}));

vi.mock("@/server/admin/queries", () => ({
  listAdminLandingPageTemplates: mocks.listAdminLandingPageTemplates,
}));

vi.mock("@/server/admin/security", () => ({
  assertAdminSameOrigin: mocks.assertAdminSameOrigin,
}));

vi.mock("@/server/admin/telemetry", () => ({
  getAdminRequestTelemetry: mocks.getAdminRequestTelemetry,
}));

vi.mock("@/server/landing-page-templates/service", () => ({
  createAdminLandingPageTemplate: mocks.createAdminLandingPageTemplate,
  getAdminLandingPageTemplate: mocks.getAdminLandingPageTemplate,
  updateAdminLandingPageTemplate: mocks.updateAdminLandingPageTemplate,
}));

import * as archiveRoute from "@/app/api/admin/templates/[id]/archive/route";
import * as collectionRoute from "@/app/api/admin/templates/route";
import * as memberRoute from "@/app/api/admin/templates/[id]/route";
import * as publishRoute from "@/app/api/admin/templates/[id]/publish/route";

describe("admin landing page template API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRequiredAdminSession.mockResolvedValue(mocks.admin);
    mocks.getAdminRequestTelemetry.mockReturnValue({
      ipHash: "ip_hash",
      userAgentHash: "ua_hash",
    });
  });

  it("lists admin templates with parsed pagination query", async () => {
    mocks.listAdminLandingPageTemplates.mockResolvedValue({
      records: [],
      total: 0,
      nextCursor: null,
    });

    const response = await collectionRoute.GET(
      new Request("https://decode.test/api/admin/templates?q=school&take=10", {
        headers: { "x-request-id": "req_list" },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.requestId).toBe("req_list");
    expect(mocks.listAdminLandingPageTemplates).toHaveBeenCalledWith({
      q: "school",
      take: 10,
    });
  });

  it("creates a template through the guarded admin mutation flow", async () => {
    const payload = buildTemplatePayload("phase-8-school-template");
    const template = { id: "tpl_123", ...payload, usageCount: 0 };
    mocks.createAdminLandingPageTemplate.mockResolvedValue(template);

    const request = jsonRequest("https://decode.test/api/admin/templates", payload, {
      requestId: "req_create",
    });
    const response = await collectionRoute.POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.template.id).toBe("tpl_123");
    expect(mocks.assertAdminSameOrigin).toHaveBeenCalledWith(request);
    expect(mocks.createAdminLandingPageTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        admin: mocks.admin,
        input: expect.objectContaining({
          key: "phase-8-school-template",
          label: "Phase 8 School Template",
        }),
        requestId: "req_create",
        telemetry: {
          ipHash: "ip_hash",
          userAgentHash: "ua_hash",
        },
      })
    );
  });

  it("returns validation errors for invalid create payloads", async () => {
    const response = await collectionRoute.POST(
      jsonRequest(
        "https://decode.test/api/admin/templates",
        { key: "Invalid Template Key" },
        { requestId: "req_invalid" }
      )
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mocks.createAdminLandingPageTemplate).not.toHaveBeenCalled();
  });

  it("loads and patches an existing template by id", async () => {
    const template = {
      id: "tpl_existing",
      ...buildTemplatePayload("phase-8-existing-template"),
    };
    mocks.getAdminLandingPageTemplate.mockResolvedValue(template);
    mocks.updateAdminLandingPageTemplate.mockResolvedValue({
      ...template,
      label: "Updated template",
    });

    const context = { params: Promise.resolve({ id: "tpl_existing" }) };
    const getResponse = await memberRoute.GET(
      new Request("https://decode.test/api/admin/templates/tpl_existing", {
        headers: { "x-request-id": "req_get" },
      }),
      context
    );
    const getBody = await getResponse.json();

    expect(getResponse.status).toBe(200);
    expect(getBody.data.template.id).toBe("tpl_existing");
    expect(mocks.getAdminLandingPageTemplate).toHaveBeenCalledWith("tpl_existing");

    const patchRequest = jsonRequest(
      "https://decode.test/api/admin/templates/tpl_existing",
      { label: "Updated template" },
      { method: "PATCH", requestId: "req_patch" }
    );
    const patchResponse = await memberRoute.PATCH(patchRequest, context);
    const patchBody = await patchResponse.json();

    expect(patchResponse.status).toBe(200);
    expect(patchBody.data.template.label).toBe("Updated template");
    expect(mocks.updateAdminLandingPageTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        admin: mocks.admin,
        templateId: "tpl_existing",
        input: { label: "Updated template" },
        requestId: "req_patch",
      })
    );
  });

  it("rejects empty patch payloads before service mutation", async () => {
    const response = await memberRoute.PATCH(
      jsonRequest(
        "https://decode.test/api/admin/templates/tpl_existing",
        {},
        { method: "PATCH", requestId: "req_empty_patch" }
      ),
      { params: Promise.resolve({ id: "tpl_existing" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mocks.updateAdminLandingPageTemplate).not.toHaveBeenCalled();
  });

  it("publishes and archives templates through guarded action routes", async () => {
    mocks.updateAdminLandingPageTemplate.mockImplementation(async ({ input }) => ({
      id: "tpl_action",
      status: input.status,
    }));
    const context = { params: Promise.resolve({ id: "tpl_action" }) };

    const publishRequest = new Request(
      "https://decode.test/api/admin/templates/tpl_action/publish",
      {
        method: "POST",
        headers: { "x-request-id": "req_publish" },
      }
    );
    const publishResponse = await publishRoute.POST(publishRequest, context);
    const publishBody = await publishResponse.json();

    expect(publishResponse.status).toBe(200);
    expect(publishBody.data.template.status).toBe("published");
    expect(mocks.updateAdminLandingPageTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: "tpl_action",
        input: { status: "published" },
        requestId: "req_publish",
      })
    );

    const archiveRequest = new Request(
      "https://decode.test/api/admin/templates/tpl_action/archive",
      {
        method: "POST",
        headers: { "x-request-id": "req_archive" },
      }
    );
    const archiveResponse = await archiveRoute.POST(archiveRequest, context);
    const archiveBody = await archiveResponse.json();

    expect(archiveResponse.status).toBe(200);
    expect(archiveBody.data.template.status).toBe("archived");
    expect(mocks.updateAdminLandingPageTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: "tpl_action",
        input: { status: "archived" },
        requestId: "req_archive",
      })
    );
  });
});

function buildTemplatePayload(key: string) {
  const template = defaultLandingPageTemplatePresets.find(
    (item) => item.key === "school-admissions"
  )!;

  return {
    ...template,
    key,
    label: "Phase 8 School Template",
    status: "draft",
    source: "admin",
  };
}

function jsonRequest(
  url: string,
  body: unknown,
  {
    method = "POST",
    requestId,
  }: {
    readonly method?: string;
    readonly requestId: string;
  }
) {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId,
    },
    body: JSON.stringify(body),
  });
}
