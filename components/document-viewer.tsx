import { computeHighlightRanges, segmentText } from "@/lib/highlight";
import type { ClauseRisk } from "@/lib/schemas/legal-audit";

const MARK_STYLES: Record<ClauseRisk["riskLevel"], string> = {
  CRITICAL: "bg-risk-critical/15 hover:bg-risk-critical/25 decoration-risk-critical",
  HIGH: "bg-risk-high/15 hover:bg-risk-high/25 decoration-risk-high",
  MEDIUM: "bg-risk-medium/15 hover:bg-risk-medium/25 decoration-risk-medium",
  LOW: "bg-risk-low/15 hover:bg-risk-low/25 decoration-risk-low",
};

type DocumentViewerProps = {
  documentText: string;
  clauses: ClauseRisk[];
};

// Left panel of the split view: full document text with each flagged
// clause's exact quote highlighted and linked to its risk card on the right.
export function DocumentViewer({ documentText, clauses }: DocumentViewerProps) {
  const ranges = computeHighlightRanges(documentText, clauses);
  const segments = segmentText(documentText, ranges);

  return (
    <article
      aria-label="Document text with flagged clauses highlighted"
      className="h-full overflow-y-auto whitespace-pre-wrap rounded-xl border border-stone-200 bg-white p-5 font-mono text-[13px] leading-[1.8] text-stone-700 shadow-diffuse-sm dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300"
    >
      {segments.map((segment, i) =>
        segment.type === "plain" ? (
          <span key={i}>{segment.text}</span>
        ) : (
          <a
            key={i}
            href={`#clause-${segment.clauseIndex}`}
            className={`rounded px-0.5 underline decoration-[1.5px] underline-offset-2 transition-colors ${MARK_STYLES[segment.level]}`}
            title="Jump to this clause's risk card"
          >
            {segment.text}
          </a>
        )
      )}
    </article>
  );
}
