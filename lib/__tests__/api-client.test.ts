import { describe, expect, it, vi, beforeEach } from "vitest";
import { analyzeDocument, askQuestion } from "@/lib/api-client";

function jsonResponse(ok: boolean, status: number, body: unknown): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

// Simulates a platform-level failure (gateway timeout/error page) where the
// body is HTML, not JSON — what a crashed/timed-out serverless function
// returns instead of our route's own JSON error response.
function htmlErrorResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => {
      throw new SyntaxError("Unexpected token '<', \"<HTML> <HE\"... is not valid JSON");
    },
  } as unknown as Response;
}

describe("askQuestion", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns the answer on success without retrying", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(true, 200, { answer: "Yes." }));

    await expect(askQuestion("doc text", "question?")).resolves.toBe("Yes.");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries on a 503 and eventually succeeds", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(false, 503, { error: "busy" }))
      .mockResolvedValueOnce(jsonResponse(true, 200, { answer: "Yes." }));

    const onRetry = vi.fn();
    await expect(askQuestion("doc text", "question?", onRetry)).resolves.toBe("Yes.");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(2, 3);
  }, 10000);

  it("does not retry a non-503 error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(false, 400, { error: "bad request" }));

    await expect(askQuestion("doc text", "question?")).rejects.toThrow("bad request");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries when the response body isn't valid JSON (platform-level failure)", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(htmlErrorResponse(502))
      .mockResolvedValueOnce(jsonResponse(true, 200, { answer: "Yes." }));

    await expect(askQuestion("doc text", "question?")).resolves.toBe("Yes.");
    expect(fetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it("eventually throws a readable error if every attempt returns non-JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(htmlErrorResponse(504));

    await expect(askQuestion("doc text", "question?")).rejects.toThrow(
      "The server returned an unexpected response."
    );
    expect(fetch).toHaveBeenCalledTimes(3);
  }, 10000);
});

describe("analyzeDocument", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns the report on success", async () => {
    const report = { report: { contractType: "NDA" }, documentText: "text" };
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(true, 200, report));

    const result = await analyzeDocument({ kind: "text", text: "doc", fileName: "doc.txt" });
    expect(result).toEqual(report);
  });
});
