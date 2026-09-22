// Lightweight in-memory fixed-window rate limiter, keyed by client IP.
//
// This is best-effort, not exact: each serverless function instance keeps
// its own map, so a client hitting a cold-started or newly-spun-up instance
// gets a fresh window. That's an acceptable tradeoff here — the goal is
// blunting casual abuse and accidental request storms against a paid GenAI
// API, not perfect distributed rate limiting, which would need external
// infra (Redis/Upstash) this project doesn't otherwise have.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const buckets = new Map<string, { count: number; resetAt: number }>();

// Prevent unbounded growth across a long-lived function instance.
const MAX_TRACKED_IPS = 5000;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size >= MAX_TRACKED_IPS) buckets.clear();
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true };
}

// Netlify/Vercel forward the real client IP via x-forwarded-for (first entry
// is the original client); fall back to a constant key if absent so local
// dev doesn't throw.
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
