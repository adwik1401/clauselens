import { getStore, type Store } from "@netlify/blobs";

// Netlify Blobs-backed fixed-window rate limiter, keyed by client IP. An
// earlier version kept counts in a plain in-memory Map, which only limited
// requests landing on the same warm Netlify Function instance — since
// Netlify can route concurrent requests to different instances, that was
// trivially bypassed under real load. Blobs is shared across every
// instance, so the limit now actually holds.
//
// Correctness under races: two concurrent requests from the same IP could
// both read the same starting count before either writes back. `onlyIfMatch`
// (optimistic concurrency via the blob's ETag) detects that and retries —
// a small, bounded number of attempts, not a true atomic increment, but
// enough to make the limit reliable in practice rather than purely
// best-effort. If Blobs itself is unavailable, requests fail open (allowed)
// rather than taking the whole app down over a rate-limit dependency.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const MAX_CONFLICT_RETRIES = 3;

type Bucket = { count: number; resetAt: number };

function store() {
  return getStore({ name: "rate-limits", consistency: "strong" });
}

export async function checkRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  let s: Store;
  try {
    s = store();
  } catch (error) {
    // getStore() itself throws synchronously outside a Netlify context
    // (e.g. plain `next dev`/`next start` without `netlify dev`) — fail
    // open rather than take the whole route down over it.
    console.error("[rate-limit] store unavailable, allowing the request:", error);
    return { allowed: true };
  }

  for (let attempt = 0; attempt <= MAX_CONFLICT_RETRIES; attempt++) {
    let current: Bucket | null;
    let etag: string | undefined;

    try {
      const result = await s.getWithMetadata(ip, { type: "json" });
      current = (result?.data as Bucket | undefined) ?? null;
      etag = result?.etag;
    } catch (error) {
      console.error("[rate-limit] read failed, allowing the request:", error);
      return { allowed: true };
    }

    const now = Date.now();
    const bucket: Bucket =
      !current || now >= current.resetAt ? { count: 0, resetAt: now + WINDOW_MS } : current;

    if (bucket.count >= MAX_REQUESTS) {
      return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
    }

    const next: Bucket = { count: bucket.count + 1, resetAt: bucket.resetAt };

    try {
      // etag undefined (no existing entry) -> onlyIfNew; otherwise onlyIfMatch
      // against what we just read, so a concurrent writer can't be silently
      // overwritten.
      const write = etag
        ? await s.setJSON(ip, next, { onlyIfMatch: etag })
        : await s.setJSON(ip, next, { onlyIfNew: true });

      if (write.modified) return { allowed: true };
      // Someone else wrote first — retry with a fresh read.
    } catch (error) {
      console.error("[rate-limit] write failed, allowing the request:", error);
      return { allowed: true };
    }
  }

  // Repeated conflicts under heavy concurrency from the same IP — allow
  // rather than block a legitimate request over a rare race.
  return { allowed: true };
}

// Netlify/Vercel forward the real client IP via x-forwarded-for (first entry
// is the original client); fall back to a constant key if absent so local
// dev doesn't throw.
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
