import { computeHighlightRanges, segmentText } from "@/lib/highlight";
import type { ClauseRisk } from "@/lib/schemas/legal-audit";

const MARK_STYLES: Record<ClauseRisk["riskLevel"], string> = {
  CRITICAL: "bg-risk-critical/20 hover:bg-risk-critical/30",
  HIGH: "bg-risk-high/20 hover:bg-risk-high/30",
  MEDIUM: "bg-risk-medium/20 hover:bg-risk-medium/30",
  LOW: "bg-risk-low/20 hover:bg-risk-low/30",
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
      className="h-full overflow-y-auto whitespace-pre-wrap rounded-xl border border-neutral-200 p-4 font-mono text-sm leading-relaxed text-neutral-800 dark:border-neutral-800 dark:text-neutral-200"
    >
      {segments.map((segment, i) =>
        segment.type === "plain" ? (
          <span key={i}>{segment.text}</span>
        ) : (
          <a
            key={i}
            href={`#clause-${segment.clauseIndex}`}
            className={`rounded px-0.5 no-underline ${MARK_STYLES[segment.level]}`}
            title="Jump to this clause's risk card"
          >
            {segment.text}
          </a>
        )
      )}
    </article>
  );
}
