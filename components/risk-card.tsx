import { RiskBadge } from "@/components/risk-badge";
import type { ClauseRisk } from "@/lib/schemas/legal-audit";

export function RiskCard({ clause, index }: { clause: ClauseRisk; index: number }) {
  return (
    <article
      id={`clause-${index}`}
      className="scroll-mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {clause.clauseTitle}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Section {clause.sectionNumber}
          </p>
        </div>
        <RiskBadge level={clause.riskLevel} />
      </div>

      <blockquote className="mt-2 border-l-2 border-neutral-300 pl-3 text-xs italic text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
        &ldquo;{clause.exactQuote}&rdquo;
      </blockquote>

      <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-200">
        {clause.plainEnglishExplanation}
      </p>

      <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
        <span className="font-medium">Why this is flagged: </span>
        {clause.potentialGotcha}
      </p>

      <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
        <span className="font-medium">Suggested next step: </span>
        {clause.suggestedNegotiationPoint}
      </p>
    </article>
  );
}
