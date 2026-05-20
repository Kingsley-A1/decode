import { describe, expect, it } from "vitest";
import {
  hashAdminSecret,
  hashAdminSessionToken,
  verifyAdminSecret,
} from "@/server/admin/crypto";

describe("admin crypto", () => {
  it("hashes and verifies registration codes and passwords", async () => {
    const hash = await hashAdminSecret("123456");

    await expect(
      verifyAdminSecret({ value: "123456", hash })
    ).resolves.toBe(true);
    await expect(
      verifyAdminSecret({ value: "654321", hash })
    ).resolves.toBe(false);
  });

  it("hashes session tokens deterministically without returning the token", () => {
    const token = "admin-session-token";
    const hash = hashAdminSessionToken(token);

    expect(hash).toHaveLength(64);
    expect(hash).toBe(hashAdminSessionToken(token));
    expect(hash).not.toContain(token);
  });
});
