import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request from a new IP", () => {
    expect(checkRateLimit("1.2.3.4-a").allowed).toBe(true);
  });

  it("allows up to the configured limit, then blocks", () => {
    const ip = "1.2.3.4-b";
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(ip).allowed).toBe(true);
    }
    const blocked = checkRateLimit(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const ip = "1.2.3.4-c";
    for (let i = 0; i < 10; i++) checkRateLimit(ip);
    expect(checkRateLimit(ip).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(checkRateLimit(ip).allowed).toBe(true);
  });

  it("tracks separate IPs independently", () => {
    const ipA = "1.2.3.4-d";
    const ipB = "5.6.7.8-d";
    for (let i = 0; i < 10; i++) checkRateLimit(ipA);
    expect(checkRateLimit(ipA).allowed).toBe(false);
    expect(checkRateLimit(ipB).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("reads the first IP from x-forwarded-for", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(getClientIp(request)).toBe("203.0.113.5");
  });

  it("falls back to 'unknown' when the header is absent", () => {
    const request = new Request("https://example.com");
    expect(getClientIp(request)).toBe("unknown");
  });
});
