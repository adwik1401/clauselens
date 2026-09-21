import { GoogleGenAI } from "@google/genai";

// Server-only: this module must never be imported from a client component.
// The API key stays on the server; nothing here is bundled to the browser.
//
// Lazily constructed: Next.js imports route modules at build time to
// collect page data, before any env vars are guaranteed to be set. Throwing
// at module load (rather than on first real use) would break `next build`
// whenever GEMINI_API_KEY isn't present in the build environment.
let client: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Copy .env.example to .env.local and add your key."
    );
  }

  client = new GoogleGenAI({ apiKey });
  return client;
}

// Flash-Lite model: large context window (full contract in one call), low
// latency. gemini-2.0-flash was retired by Google; its suggested replacement,
// gemini-3.6-flash, has only a 20-requests/day free-tier quota (confirmed by
// hitting it during testing — 429 RESOURCE_EXHAUSTED, limit: 20). Verified
// directly against the live API (models.list + a real structured-output
// call, not just documentation) that gemini-3.5-flash-lite is available on
// this key with separate, unexhausted quota and produces equivalent-quality
// structured JSON output for this use case.
export const GEMINI_MODEL = "gemini-3.5-flash-lite";

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("503") || message.includes("UNAVAILABLE") || message.includes("high demand");
}

// Gemini returns transient 503s under load often enough in practice that a
// single retry meaningfully improves success rate. Kept to one short-delay
// retry (not exponential backoff) to stay well within serverless function
// time limits — the analysis call already takes several seconds on its own.
export async function withGeminiRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isRetryableError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return fn();
  }
}

// Maps a Gemini API failure to an HTTP status and message the client can
// act on correctly. This distinction matters: a 503 ("high demand") is
// worth retrying within seconds, but a 429 quota-exhaustion error is not —
// the quota resets on Google's clock, not ours, so the client-side retry
// (lib/api-client.ts) only retries on 503, never on 429.
export function classifyGeminiError(error: unknown): { status: number; message: string } {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("429")) {
    return {
      status: 429,
      message:
        "The AI service's request quota has been used up for now. This resets on a timer — please try again later.",
    };
  }

  if (isRetryableError(error)) {
    return {
      status: 503,
      message: "The AI service is experiencing high demand right now. Please wait a moment and try again.",
    };
  }

  return { status: 500, message: "Analysis failed. Please try again." };
}
