import { describe, expect, it } from "vitest";
import {
  adminLoginRequestSchema,
  adminRegisterRequestSchema,
} from "@/server/admin/schemas";

describe("admin schemas", () => {
  it("accepts credential registration with a 6-10 digit code", () => {
    const result = adminRegisterRequestSchema.parse({
      name: "Decode Admin",
      email: "ADMIN@EXAMPLE.COM",
      password: "strong-password-123",
      confirmPassword: "strong-password-123",
      registrationCode: "123456",
    });

    expect(result.email).toBe("admin@example.com");
  });

  it("rejects weak registration inputs", () => {
    expect(() =>
      adminRegisterRequestSchema.parse({
        name: "A",
        email: "not-email",
        password: "short",
        confirmPassword: "different",
        registrationCode: "abc",
      })
    ).toThrow();
  });

  it("normalizes login email", () => {
    const result = adminLoginRequestSchema.parse({
      email: "OWNER@EXAMPLE.COM",
      password: "password",
    });

    expect(result.email).toBe("owner@example.com");
  });
});
