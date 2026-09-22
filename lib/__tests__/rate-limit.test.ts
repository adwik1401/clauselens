import { describe, expect, it, vi, beforeEach } from "vitest";

// Inlined rather than imported from netlify-blobs-mock.ts: vi.hoisted()
// runs before this file's own imports resolve, so a cross-file import
// isn't available yet inside the hoisted callback.
const mockStore = vi.hoisted(() => {
  const data = new Map<string, unknown>();
  const etags = new Map<string, string>();
  let etagCounter = 0;
  return {
    async get(key: string) {
      return data.has(key) ? data.get(key) : null;
    },
    async getWithMetadata(key: string) {
      if (!data.has(key)) return null;
      return { data: data.get(key), etag: etags.get(key) };
    },
    async setJSON(key: string, value: unknown, options?: { onlyIfNew?: boolean; onlyIfMatch?: string }) {
      if (options?.onlyIfNew && data.has(key)) return { modified: false };
      if (options?.onlyIfMatch && etags.get(key) !== options.onlyIfMatch) return { modified: false };
      const etag = `etag-${++etagCounter}`;
      data.set(key, value);
      etags.set(key, etag);
      return { modified: true, etag };
    },
    async delete(key: string) {
      data.delete(key);
      etags.delete(key);
    },
    _reset() {
      data.clear();
      etags.clear();
      etagCounter = 0;
    },
  };
});

vi.mock("@netlify/blobs", () => ({
  getStore: () => mockStore,
}));

const { checkRateLimit, getClientIp } = await import("@/lib/rate-limit");

describe("checkRateLimit", () => {
  beforeEach(() => {
    mockStore._reset();
  });

  it("allows the first request from a new IP", async () => {
    expect((await checkRateLimit("1.2.3.4-a")).allowed).toBe(true);
  });

  it("allows up to the configured limit, then blocks", async () => {
    const ip = "1.2.3.4-b";
    for (let i = 0; i < 10; i++) {
      expect((await checkRateLimit(ip)).allowed).toBe(true);
    }
    const blocked = await checkRateLimit(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window elapses", async () => {
    vi.useFakeTimers();
    try {
      const ip = "1.2.3.4-c";
      for (let i = 0; i < 10; i++) await checkRateLimit(ip);
      expect((await checkRateLimit(ip)).allowed).toBe(false);

      vi.advanceTimersByTime(60_001);

      expect((await checkRateLimit(ip)).allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tracks separate IPs independently", async () => {
    const ipA = "1.2.3.4-d";
    const ipB = "5.6.7.8-d";
    for (let i = 0; i < 10; i++) await checkRateLimit(ipA);
    expect((await checkRateLimit(ipA)).allowed).toBe(false);
    expect((await checkRateLimit(ipB)).allowed).toBe(true);
  });

  it("fails open when the store errors on read", async () => {
    const brokenStore = { getWithMetadata: () => Promise.reject(new Error("store unavailable")) };
    vi.doMock("@netlify/blobs", () => ({ getStore: () => brokenStore }));
    vi.resetModules();
    const { checkRateLimit: checkWithBrokenStore } = await import("@/lib/rate-limit");
    expect((await checkWithBrokenStore("1.2.3.4-e")).allowed).toBe(true);
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
