import { describe, expect, it } from "vitest";
import { computeHighlightRanges, segmentText } from "@/lib/highlight";
import type { ClauseRisk } from "@/lib/schemas/legal-audit";

function makeClause(overrides: Partial<ClauseRisk>): ClauseRisk {
  return {
    clauseTitle: "Test Clause",
    sectionNumber: "1.1",
    exactQuote: "quote",
    riskLevel: "MEDIUM",
    plainEnglishExplanation: "",
    potentialGotcha: "",
    suggestedNegotiationPoint: "",
    ...overrides,
  };
}

describe("computeHighlightRanges", () => {
  it("finds the quote's location in the document", () => {
    const doc = "Intro text. The indemnification clause applies here. Outro.";
    const clauses = [makeClause({ exactQuote: "indemnification clause" })];

    const ranges = computeHighlightRanges(doc, clauses);

    expect(ranges).toHaveLength(1);
    expect(doc.slice(ranges[0].start, ranges[0].end)).toBe("indemnification clause");
  });

  it("skips a quote that isn't found verbatim in the document", () => {
    const doc = "Nothing matches here.";
    const clauses = [makeClause({ exactQuote: "not present" })];

    expect(computeHighlightRanges(doc, clauses)).toHaveLength(0);
  });

  it("drops overlapping ranges, keeping the earliest", () => {
    const doc = "The quick brown fox jumps.";
    const clauses = [
      makeClause({ exactQuote: "quick brown" }),
      makeClause({ exactQuote: "brown fox" }),
    ];

    const ranges = computeHighlightRanges(doc, clauses);

    expect(ranges).toHaveLength(1);
    expect(doc.slice(ranges[0].start, ranges[0].end)).toBe("quick brown");
  });
});

describe("segmentText", () => {
  it("splits text into plain and highlight segments", () => {
    const doc = "before MATCH after";
    const ranges = [{ start: 7, end: 12, clauseIndex: 0, level: "LOW" as const }];

    const segments = segmentText(doc, ranges);

    expect(segments).toEqual([
      { type: "plain", text: "before " },
      { type: "highlight", text: "MATCH", clauseIndex: 0, level: "LOW" },
      { type: "plain", text: " after" },
    ]);
  });

  it("returns a single plain segment when there are no ranges", () => {
    expect(segmentText("no highlights here", [])).toEqual([
      { type: "plain", text: "no highlights here" },
    ]);
  });
});
