import { describe, expect, it } from "vitest";
import { buildScanTelemetry } from "@/server/analytics/scan";

describe("buildScanTelemetry", () => {
  it("classifies mobile scans and hashes private telemetry", () => {
    process.env.AUTH_SECRET = "test-secret";
    const request = new Request("https://decode.example/r/spring", {
      headers: {
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
        "x-forwarded-for": "203.0.113.10, 198.51.100.4",
        referer: "https://example.com/newsletter",
        "x-vercel-ip-country": "US",
        "x-vercel-ip-country-region": "CA",
      },
    });

    const telemetry = buildScanTelemetry(request);

    expect(telemetry.deviceClass).toBe("mobile");
    expect(telemetry.browser).toBe("safari");
    expect(telemetry.operatingSystem).toBe("ios");
    expect(telemetry.referrer).toBe("https://example.com");
    expect(telemetry.country).toBe("US");
    expect(telemetry.region).toBe("CA");
    expect(telemetry.ipHash).toHaveLength(64);
    expect(telemetry.ipHash).not.toContain("203.0.113.10");
    expect(telemetry.userAgentHash).toHaveLength(64);
  });

  it("uses unknown classifications when headers are missing", () => {
    const telemetry = buildScanTelemetry(
      new Request("https://decode.example/r/spring")
    );

    expect(telemetry.deviceClass).toBe("unknown");
    expect(telemetry.browser).toBe("unknown");
    expect(telemetry.operatingSystem).toBe("unknown");
    expect(telemetry.ipHash).toBeNull();
    expect(telemetry.userAgentHash).toBeNull();
  });

  it("stores only the referrer origin, never its path or query", () => {
    const telemetry = buildScanTelemetry(
      new Request("https://decode.example/r/spring", {
        headers: {
          referer:
            "https://mail.example.com/inbox/thread/42?token=super-secret&user=jane",
        },
      })
    );

    expect(telemetry.referrer).toBe("https://mail.example.com");
  });

  it("drops an unparseable referrer", () => {
    const telemetry = buildScanTelemetry(
      new Request("https://decode.example/r/spring", {
        headers: { referer: "not a url at all" },
      })
    );

    expect(telemetry.referrer).toBeNull();
  });

  it("stores null hashes in production when no salt secret is configured", () => {
    const saved = {
      NODE_ENV: process.env.NODE_ENV,
      AUTH_SECRET: process.env.AUTH_SECRET,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    };

    try {
      delete process.env.AUTH_SECRET;
      delete process.env.NEXTAUTH_SECRET;
      (process.env as Record<string, string>).NODE_ENV = "production";

      const telemetry = buildScanTelemetry(
        new Request("https://decode.example/r/spring", {
          headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0",
            "x-forwarded-for": "203.0.113.10",
          },
        })
      );

      expect(telemetry.ipHash).toBeNull();
      expect(telemetry.userAgentHash).toBeNull();
      // Non-hash telemetry is unaffected.
      expect(telemetry.deviceClass).toBe("desktop");
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          (process.env as Record<string, string>)[key] = value;
        }
      }
    }
  });

  it("hashes with the configured secret in production", () => {
    const saved = {
      NODE_ENV: process.env.NODE_ENV,
      AUTH_SECRET: process.env.AUTH_SECRET,
    };

    try {
      (process.env as Record<string, string>).AUTH_SECRET = "prod-secret";
      (process.env as Record<string, string>).NODE_ENV = "production";

      const telemetry = buildScanTelemetry(
        new Request("https://decode.example/r/spring", {
          headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0",
            "x-forwarded-for": "203.0.113.10",
          },
        })
      );

      expect(telemetry.ipHash).toHaveLength(64);
      expect(telemetry.userAgentHash).toHaveLength(64);
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          (process.env as Record<string, string>)[key] = value;
        }
      }
    }
  });
});
