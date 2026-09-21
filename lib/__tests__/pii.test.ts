import { describe, expect, it } from "vitest";
import { sanitizePII } from "@/lib/pii";

describe("sanitizePII", () => {
  it("masks email addresses", () => {
    expect(sanitizePII("Contact jane.doe@example.com for details.")).toBe(
      "Contact [EMAIL] for details."
    );
  });

  it("masks US-style phone numbers", () => {
    expect(sanitizePII("Call (555) 123-4567 anytime.")).toBe("Call [PHONE] anytime.");
  });

  it("masks SSN-formatted numbers", () => {
    expect(sanitizePII("SSN: 123-45-6789")).toBe("SSN: [SSN]");
  });

  it("leaves ordinary contract text untouched", () => {
    const text = "Contractor shall indemnify Client for all claims arising from Services.";
    expect(sanitizePII(text)).toBe(text);
  });

  it("masks multiple PII instances in the same document", () => {
    const text = "Email a@b.com or call 555-123-9999.";
    const result = sanitizePII(text);
    expect(result).not.toContain("a@b.com");
    expect(result).toContain("[EMAIL]");
  });
});
