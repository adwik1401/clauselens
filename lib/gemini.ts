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
// cheap enough for repeated hackathon-demo use.
export const GEMINI_MODEL = "gemini-2.0-flash";
