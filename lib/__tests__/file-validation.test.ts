import { describe, expect, it } from "vitest";
import { isValidPdf } from "@/lib/file-validation";

describe("isValidPdf", () => {
  it("accepts a buffer starting with the PDF magic bytes", () => {
    const buffer = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.from("rest of file")]);
    expect(isValidPdf(buffer)).toBe(true);
  });

  it("rejects plain text mislabeled as a PDF", () => {
    const buffer = Buffer.from("Landlord may retain the security deposit...");
    expect(isValidPdf(buffer)).toBe(false);
  });

  it("rejects an empty buffer", () => {
    expect(isValidPdf(Buffer.alloc(0))).toBe(false);
  });
});
