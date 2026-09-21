import { GoogleGenAI } from "@google/genai";

// Server-only: this module must never be imported from a client component.
// The API key stays on the server; nothing here is bundled to the browser.
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is not set. Copy .env.example to .env.local and add your key."
  );
}

export const gemini = new GoogleGenAI({ apiKey });

// Flash model: large context window (full contract in one call), low latency,
// cheap enough for repeated hackathon-demo use.
export const GEMINI_MODEL = "gemini-2.0-flash";
