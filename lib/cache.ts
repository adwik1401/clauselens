import { createHash } from "crypto";
import type { LegalAuditReport } from "@/lib/schemas/legal-audit";

// In-memory cache keyed by a hash of the sanitized document text. Analyzing
// the same document twice (a retry, a re-clicked sample button, a demo
// re-run) is common and otherwise re-pays the full Gemini call every time.
// Scoped to a single function instance's lifetime — no external cache
// infra, consistent with the rate limiter's tradeoffs (see lib/rate-limit.ts).
const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ENTRIES = 200;

type CacheEntry = { report: LegalAuditReport; documentText: string; expiresAt: number };

const cache = new Map<string, CacheEntry>();

export function hashDocument(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function getCachedAnalysis(hash: string): CacheEntry | null {
  const entry = cache.get(hash);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    cache.delete(hash);
    return null;
  }
  return entry;
}

export function setCachedAnalysis(hash: string, report: LegalAuditReport, documentText: string): void {
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(hash, { report, documentText, expiresAt: Date.now() + TTL_MS });
}
