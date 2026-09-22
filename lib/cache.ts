import { createHash } from "crypto";
import { getStore } from "@netlify/blobs";
import type { LegalAuditReport } from "@/lib/schemas/legal-audit";

// Netlify Blobs-backed cache, keyed by a hash of the sanitized document
// text. An earlier version of this cache was a plain in-memory Map, which
// only helped when a request happened to land on the same warm Netlify
// Function instance that served the original — a real weakness, since
// Netlify routes concurrent requests across multiple instances. Blobs is a
// shared, durable store all instances read from, so a cache hit is now
// reliable regardless of which instance handles the request.
const TTL_MS = 10 * 60 * 1000; // 10 minutes

type CacheEntry = { report: LegalAuditReport; documentText: string; expiresAt: number };

function store() {
  return getStore({ name: "analysis-cache", consistency: "strong" });
}

export function hashDocument(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export async function getCachedAnalysis(hash: string): Promise<CacheEntry | null> {
  try {
    const entry = (await store().get(hash, { type: "json" })) as CacheEntry | null;
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
      await store()
        .delete(hash)
        .catch(() => {});
      return null;
    }
    return entry;
  } catch (error) {
    // Blobs being unavailable should degrade to "no cache", not break analysis.
    console.error("[cache] read failed, treating as a miss:", error);
    return null;
  }
}

export async function setCachedAnalysis(
  hash: string,
  report: LegalAuditReport,
  documentText: string
): Promise<void> {
  const entry: CacheEntry = { report, documentText, expiresAt: Date.now() + TTL_MS };
  try {
    await store().setJSON(hash, entry);
  } catch (error) {
    // Caching is an optimization, not a correctness requirement — a failed
    // write just means the next identical request re-analyzes.
    console.error("[cache] write failed, continuing without caching this entry:", error);
  }
}
