import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getCachedAnalysis, hashDocument, setCachedAnalysis } from "@/lib/cache";
import type { LegalAuditReport } from "@/lib/schemas/legal-audit";

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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for an uncached hash", () => {
    expect(getCachedAnalysis(hashDocument("never analyzed"))).toBeNull();
  });

  it("returns a cached entry after it's been set", () => {
    const hash = hashDocument("a real document");
    setCachedAnalysis(hash, SAMPLE_REPORT, "a real document");
    const cached = getCachedAnalysis(hash);
    expect(cached?.report).toEqual(SAMPLE_REPORT);
    expect(cached?.documentText).toBe("a real document");
  });

  it("expires an entry after the TTL elapses", () => {
    const hash = hashDocument("expiring document");
    setCachedAnalysis(hash, SAMPLE_REPORT, "expiring document");
    expect(getCachedAnalysis(hash)).not.toBeNull();

    vi.advanceTimersByTime(10 * 60 * 1000 + 1);

    expect(getCachedAnalysis(hash)).toBeNull();
  });
});
