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

// Flash model: large context window (full contract in one call), low latency,
// cheap enough for repeated hackathon-demo use. gemini-2.0-flash was retired
// by Google; gemini-3.6-flash is the current replacement (confirmed via the
// API's own 404 error message, which names it directly).
export const GEMINI_MODEL = "gemini-3.6-flash";

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
