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
    expect(telemetry.referrer).toBe("https://example.com/newsletter");
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
});
