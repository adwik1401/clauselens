import { describe, expect, it } from "vitest";
import { parseClauseBlocks, renderClauseOutline } from "@/lib/clause-parser";

describe("parseClauseBlocks", () => {
  it("splits a document into blocks at SECTION headings", () => {
    const doc = [
      "SECTION 1. SCOPE",
      "Contractor agrees to provide Services.",
      "",
      "SECTION 2. PAYMENT",
      "Client shall pay within 30 days.",
    ].join("\n");

    const blocks = parseClauseBlocks(doc);

    expect(blocks).toHaveLength(2);
    expect(blocks[0].heading).toBe("SECTION 1. SCOPE");
    expect(blocks[0].text).toContain("Contractor agrees to provide Services.");
    expect(blocks[1].heading).toBe("SECTION 2. PAYMENT");
  });

  it("splits at numbered clauses like '4.1 Indemnification'", () => {
    const doc = ["4.1 Indemnification", "Contractor shall indemnify Client."].join("\n");

    const blocks = parseClauseBlocks(doc);

    expect(blocks[0].heading).toBe("4.1 Indemnification");
  });

  it("returns a single headless block for text with no recognizable headings", () => {
    const doc = "Just a plain paragraph with no structure.";

    const blocks = parseClauseBlocks(doc);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].heading).toBeNull();
  });

  it("ignores blank-only input", () => {
    expect(parseClauseBlocks("   \n\n  ")).toHaveLength(0);
  });
});

describe("renderClauseOutline", () => {
  it("numbers each block and includes its heading", () => {
    const blocks = parseClauseBlocks("SECTION 1. SCOPE\nText here.");
    const outline = renderClauseOutline(blocks);

    expect(outline).toContain("[Block 1] SECTION 1. SCOPE");
    expect(outline).toContain("Text here.");
  });
});
