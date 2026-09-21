import type { ClauseRisk } from "@/lib/schemas/legal-audit";

export type HighlightRange = {
  start: number;
  end: number;
  clauseIndex: number;
  level: ClauseRisk["riskLevel"];
};

// Locates each flagged clause's exact quote inside the full document text.
// Quotes that can't be found (the model deviated from "verbatim") are
// silently skipped rather than breaking the highlight pass — the risk card
// itself still renders on the right, just without a left-panel anchor.
export function computeHighlightRanges(
  documentText: string,
  clauses: ClauseRisk[]
): HighlightRange[] {
  const ranges: HighlightRange[] = [];

  clauses.forEach((clause, clauseIndex) => {
    if (!clause.exactQuote) return;
    const start = documentText.indexOf(clause.exactQuote);
    if (start === -1) return;
    ranges.push({
      start,
      end: start + clause.exactQuote.length,
      clauseIndex,
      level: clause.riskLevel,
    });
  });

  ranges.sort((a, b) => a.start - b.start);

  // Drop overlapping ranges (keep the first, earliest-starting one) so
  // segments never nest or collide when rendered.
  const nonOverlapping: HighlightRange[] = [];
  let lastEnd = -1;
  for (const range of ranges) {
    if (range.start >= lastEnd) {
      nonOverlapping.push(range);
      lastEnd = range.end;
    }
  }

  return nonOverlapping;
}

export type TextSegment =
  | { type: "plain"; text: string }
  | { type: "highlight"; text: string; clauseIndex: number; level: ClauseRisk["riskLevel"] };

export function segmentText(documentText: string, ranges: HighlightRange[]): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({ type: "plain", text: documentText.slice(cursor, range.start) });
    }
    segments.push({
      type: "highlight",
      text: documentText.slice(range.start, range.end),
      clauseIndex: range.clauseIndex,
      level: range.level,
    });
    cursor = range.end;
  }

  if (cursor < documentText.length) {
    segments.push({ type: "plain", text: documentText.slice(cursor) });
  }

  return segments;
}
