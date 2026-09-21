import { describe, expect, it } from "vitest";
import { classifyGeminiError } from "@/lib/gemini";

describe("classifyGeminiError", () => {
  it("maps a 503/UNAVAILABLE error to a retryable 503", () => {
    const result = classifyGeminiError(new Error("got status: 503 Service Unavailable. UNAVAILABLE"));
    expect(result.status).toBe(503);
    expect(result.message).toMatch(/high demand/i);
  });

  it("maps a 429/RESOURCE_EXHAUSTED quota error to a non-retryable 429", () => {
    const result = classifyGeminiError(
      new Error("got status: 429 Too Many Requests. RESOURCE_EXHAUSTED quota exceeded")
    );
    expect(result.status).toBe(429);
    expect(result.message).toMatch(/quota/i);
  });

  it("maps an unrelated error to a generic 500", () => {
    const result = classifyGeminiError(new Error("invalid API key"));
    expect(result.status).toBe(500);
  });
});
