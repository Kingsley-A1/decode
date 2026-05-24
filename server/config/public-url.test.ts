import { afterEach, describe, expect, it } from "vitest";
import { getPublicAppBaseUrl } from "@/server/config/public-url";

const originalEnv = {
  APP_URL: process.env.APP_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
};

describe("public app URL policy", () => {
  afterEach(() => {
    process.env.APP_URL = originalEnv.APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = originalEnv.NEXT_PUBLIC_APP_URL;
    process.env.NEXTAUTH_URL = originalEnv.NEXTAUTH_URL;
    process.env.VERCEL_ENV = originalEnv.VERCEL_ENV;
    process.env.NEXT_PUBLIC_VERCEL_ENV = originalEnv.NEXT_PUBLIC_VERCEL_ENV;
  });

  it("normalizes configured public URLs to their origin", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://preview.decode.test/app";

    expect(getPublicAppBaseUrl()).toBe("https://preview.decode.test");
  });

  it("allows localhost outside production", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3333";

    expect(getPublicAppBaseUrl()).toBe("http://127.0.0.1:3333");
  });

  it("requires the canonical Decode origin in Vercel production", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = "https://decode.com.ngh";

    expect(() => getPublicAppBaseUrl()).toThrow(
      "Production public app URL must be https://decode.com.ng"
    );
  });

  it("rejects localhost in Vercel production", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3333";

    expect(() => getPublicAppBaseUrl()).toThrow(
      "Production public app URL must be https://decode.com.ng"
    );
  });
});
