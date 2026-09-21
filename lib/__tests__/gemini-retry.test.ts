import { describe, expect, it, vi } from "vitest";
import { withGeminiRetry } from "@/lib/gemini";

describe("withGeminiRetry", () => {
  it("returns the result on first success without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withGeminiRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries once on a 503 and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("got status: 503 Service Unavailable"))
      .mockResolvedValueOnce("ok");

    await expect(withGeminiRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  }, 3000);

  it("does not retry a non-transient error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("invalid API key"));

    await expect(withGeminiRetry(fn)).rejects.toThrow("invalid API key");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("propagates the error if the retry also fails", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("503 Service Unavailable"));

    await expect(withGeminiRetry(fn)).rejects.toThrow("503");
    expect(fn).toHaveBeenCalledTimes(2);
  }, 3000);
});
