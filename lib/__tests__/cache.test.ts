import { describe, expect, it, vi, beforeEach } from "vitest";
import type { LegalAuditReport } from "@/lib/schemas/legal-audit";

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

const { getCachedAnalysis, hashDocument, setCachedAnalysis } = await import("@/lib/cache");

const SAMPLE_REPORT: LegalAuditReport = {
  contractType: "NDA",
  governingLaw: null,
  overallRiskScore: 50,
  executiveSummary: "Summary.",
  keyRightsGranted: [],
  keyObligationsAssumed: [],
  flaggedClauses: [],
  questionsForLawyer: ["Is this enforceable?"],
  actionChecklist: [],
};

describe("hashDocument", () => {
  it("produces the same hash for identical text", () => {
    expect(hashDocument("hello world")).toBe(hashDocument("hello world"));
  });

  it("produces different hashes for different text", () => {
    expect(hashDocument("hello world")).not.toBe(hashDocument("goodbye world"));
  });
});

describe("cache", () => {
  beforeEach(() => {
    mockStore._reset();
  });

  it("returns null for an uncached hash", async () => {
    expect(await getCachedAnalysis(hashDocument("never analyzed"))).toBeNull();
  });

  it("returns a cached entry after it's been set", async () => {
    const hash = hashDocument("a real document");
    await setCachedAnalysis(hash, SAMPLE_REPORT, "a real document");
    const cached = await getCachedAnalysis(hash);
    expect(cached?.report).toEqual(SAMPLE_REPORT);
    expect(cached?.documentText).toBe("a real document");
  });

  it("expires an entry after the TTL elapses", async () => {
    vi.useFakeTimers();
    try {
      const hash = hashDocument("expiring document");
      await setCachedAnalysis(hash, SAMPLE_REPORT, "expiring document");
      expect(await getCachedAnalysis(hash)).not.toBeNull();

      vi.advanceTimersByTime(10 * 60 * 1000 + 1);

      expect(await getCachedAnalysis(hash)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("treats a store read failure as a cache miss rather than throwing", async () => {
    const brokenStore = { get: () => Promise.reject(new Error("store unavailable")) };
    vi.doMock("@netlify/blobs", () => ({ getStore: () => brokenStore }));
    vi.resetModules();
    const { getCachedAnalysis: getWithBrokenStore } = await import("@/lib/cache");
    await expect(getWithBrokenStore("any-hash")).resolves.toBeNull();
  });
});
