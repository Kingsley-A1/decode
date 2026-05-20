import { describe, expect, it } from "vitest";
import { assertAdminSameOrigin } from "@/server/admin/security";
import { AdminAuthError } from "@/server/admin/errors";

describe("assertAdminSameOrigin", () => {
  it("allows same-origin admin mutations", () => {
    const request = new Request("https://decode.example/api/admin/auth/login", {
      headers: { origin: "https://decode.example" },
    });

    expect(() => assertAdminSameOrigin(request)).not.toThrow();
  });

  it("rejects cross-origin admin mutations", () => {
    const request = new Request("https://decode.example/api/admin/auth/login", {
      headers: { origin: "https://evil.example" },
    });

    expect(() => assertAdminSameOrigin(request)).toThrow(AdminAuthError);
  });
});
