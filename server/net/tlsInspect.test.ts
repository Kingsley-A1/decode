import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { inspectTls, type TlsConnectImpl } from "@/server/net/tlsInspect";

const NOW = () => Date.parse("2026-06-01T00:00:00.000Z");

interface FakeCert {
  readonly issuer?: Record<string, string>;
  readonly subject?: Record<string, string>;
  readonly valid_from?: string;
  readonly valid_to?: string;
  readonly subjectaltname?: string;
}

interface FakeSocketOptions {
  readonly cert: FakeCert;
  readonly authorized?: boolean;
  readonly mode?: "secureConnect" | "error" | "silent";
  readonly error?: Error;
}

function fakeConnect(options: FakeSocketOptions): TlsConnectImpl {
  return (() => {
    const socket = new EventEmitter() as EventEmitter & {
      authorized: boolean;
      getPeerCertificate: () => FakeCert;
      destroy: () => void;
    };
    socket.authorized = options.authorized ?? true;
    socket.getPeerCertificate = () => options.cert;
    socket.destroy = () => undefined;

    const mode = options.mode ?? "secureConnect";
    if (mode !== "silent") {
      queueMicrotask(() => {
        if (mode === "error") {
          socket.emit("error", options.error ?? new Error("handshake failed"));
        } else {
          socket.emit("secureConnect");
        }
      });
    }

    return socket;
  }) as unknown as TlsConnectImpl;
}

function caCert(overrides: FakeCert = {}): FakeCert {
  return {
    issuer: { CN: "R3", O: "Let's Encrypt" },
    subject: { CN: "example.com" },
    valid_from: "Jan  1 00:00:00 2026 GMT",
    valid_to: "Dec 31 00:00:00 2026 GMT",
    subjectaltname: "DNS:example.com, DNS:www.example.com",
    ...overrides,
  };
}

describe("inspectTls", () => {
  it("derives a healthy result for a valid certificate", async () => {
    const result = await inspectTls({
      host: "example.com",
      now: NOW,
      connectImpl: fakeConnect({ cert: caCert() }),
    });

    expect(result.error).toBeNull();
    expect(result.selfSigned).toBe(false);
    expect(result.hostnameMatches).toBe(true);
    expect(result.daysToExpiry).toBeGreaterThan(0);
    expect(result.chainAuthorized).toBe(true);
  });

  it("detects self-signed certificates by issuer/subject equality", async () => {
    const result = await inspectTls({
      host: "example.com",
      now: NOW,
      connectImpl: fakeConnect({
        cert: caCert({
          issuer: { CN: "example.com" },
          subject: { CN: "example.com" },
        }),
      }),
    });

    expect(result.selfSigned).toBe(true);
  });

  it("reports a negative daysToExpiry for an expired certificate", async () => {
    const result = await inspectTls({
      host: "example.com",
      now: NOW,
      connectImpl: fakeConnect({
        cert: caCert({ valid_to: "Jan  1 00:00:00 2025 GMT" }),
      }),
    });

    expect(result.daysToExpiry).toBeLessThan(0);
  });

  it("matches a wildcard SAN against a single label", async () => {
    const result = await inspectTls({
      host: "api.example.com",
      now: NOW,
      connectImpl: fakeConnect({
        cert: caCert({
          subject: { CN: "*.example.com" },
          subjectaltname: "DNS:*.example.com",
        }),
      }),
    });

    expect(result.hostnameMatches).toBe(true);
  });

  it("does not match a wildcard SAN across multiple labels", async () => {
    const result = await inspectTls({
      host: "a.b.example.com",
      now: NOW,
      connectImpl: fakeConnect({
        cert: caCert({
          subject: { CN: "*.example.com" },
          subjectaltname: "DNS:*.example.com",
        }),
      }),
    });

    expect(result.hostnameMatches).toBe(false);
  });

  it("flags a hostname that the certificate does not cover", async () => {
    const result = await inspectTls({
      host: "evil.test",
      now: NOW,
      connectImpl: fakeConnect({ cert: caCert() }),
    });

    expect(result.hostnameMatches).toBe(false);
  });

  it("returns an error result when the handshake fails", async () => {
    const result = await inspectTls({
      host: "example.com",
      now: NOW,
      connectImpl: fakeConnect({
        cert: {},
        mode: "error",
        error: new Error("ECONNRESET"),
      }),
    });

    expect(result.error).toBe("ECONNRESET");
    expect(result.hostnameMatches).toBe(false);
  });

  it("returns an error result when no certificate is presented", async () => {
    const result = await inspectTls({
      host: "example.com",
      now: NOW,
      connectImpl: fakeConnect({ cert: {} }),
    });

    expect(result.error).toBe("no_peer_certificate");
  });

  it("times out when the handshake never completes", async () => {
    const result = await inspectTls({
      host: "example.com",
      now: NOW,
      timeoutMs: 5,
      connectImpl: fakeConnect({ cert: caCert(), mode: "silent" }),
    });

    expect(result.error).toBe("timeout");
  });
});
