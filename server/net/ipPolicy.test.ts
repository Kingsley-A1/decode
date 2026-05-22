import { describe, expect, it } from "vitest";
import {
  isIpLiteral,
  isLocalhost,
  isPrivateOrReservedIp,
  stripIpv6Brackets,
} from "@/server/net/ipPolicy";

describe("isLocalhost", () => {
  it("matches plain localhost and subdomains", () => {
    expect(isLocalhost("localhost")).toBe(true);
    expect(isLocalhost("api.localhost")).toBe(true);
    expect(isLocalhost("LOCALHOST")).toBe(true);
  });

  it("does not match unrelated hosts", () => {
    expect(isLocalhost("example.com")).toBe(false);
    expect(isLocalhost("localhost.example.com")).toBe(false);
  });
});

describe("isPrivateOrReservedIp", () => {
  it("rejects every classic private IPv4 range", () => {
    expect(isPrivateOrReservedIp("10.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("172.16.5.5")).toBe(true);
    expect(isPrivateOrReservedIp("172.31.99.99")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.1.1")).toBe(true);
    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("0.0.0.0")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true); // EC2 metadata
    expect(isPrivateOrReservedIp("100.64.0.1")).toBe(true); // CGNAT
    expect(isPrivateOrReservedIp("255.255.255.255")).toBe(true);
    expect(isPrivateOrReservedIp("224.0.0.1")).toBe(true); // multicast
  });

  it("does not reject public IPv4 addresses", () => {
    expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);
    expect(isPrivateOrReservedIp("1.1.1.1")).toBe(false);
    expect(isPrivateOrReservedIp("172.15.0.1")).toBe(false);
    expect(isPrivateOrReservedIp("172.32.0.1")).toBe(false);
  });

  it("rejects loopback and ULA IPv6 ranges", () => {
    expect(isPrivateOrReservedIp("::1")).toBe(true);
    expect(isPrivateOrReservedIp("::")).toBe(true);
    expect(isPrivateOrReservedIp("fc00::1")).toBe(true);
    expect(isPrivateOrReservedIp("fd12:3456:789a::1")).toBe(true);
    expect(isPrivateOrReservedIp("fe80::1")).toBe(true);
  });

  it("does not flag global IPv6 addresses", () => {
    expect(isPrivateOrReservedIp("2606:4700:4700::1111")).toBe(false);
  });

  it("returns false for non-IP strings", () => {
    expect(isPrivateOrReservedIp("example.com")).toBe(false);
    expect(isPrivateOrReservedIp("not-an-ip")).toBe(false);
    expect(isPrivateOrReservedIp("")).toBe(false);
  });
});

describe("stripIpv6Brackets", () => {
  it("removes leading and trailing brackets", () => {
    expect(stripIpv6Brackets("[::1]")).toBe("::1");
    expect(stripIpv6Brackets("::1")).toBe("::1");
  });
});

describe("isIpLiteral", () => {
  it("flags raw IP hostnames including bracketed IPv6", () => {
    expect(isIpLiteral("1.2.3.4")).toBe(true);
    expect(isIpLiteral("[::1]")).toBe(true);
    expect(isIpLiteral("fe80::1")).toBe(true);
  });

  it("does not flag normal domain names", () => {
    expect(isIpLiteral("example.com")).toBe(false);
    expect(isIpLiteral("api.example.com")).toBe(false);
  });
});
