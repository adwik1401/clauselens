import { RiskBadge } from "@/components/risk-badge";
import type { ClauseRisk } from "@/lib/schemas/legal-audit";

export function RiskCard({ clause, index }: { clause: ClauseRisk; index: number }) {
  return (
    <article
      id={`clause-${index}`}
      className={`stagger-delay-${Math.min(index, 8)} animate-fade-up scroll-mt-4 rounded-xl border border-stone-200 bg-white p-4 shadow-diffuse-sm transition-shadow duration-200 hover:shadow-diffuse dark:border-stone-800 dark:bg-stone-900`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            {clause.clauseTitle}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-stone-400 dark:text-stone-500">
            Section {clause.sectionNumber}
          </p>
        </div>
        <RiskBadge level={clause.riskLevel} />
      </div>

      <blockquote className="mt-3 border-l-2 border-stone-200 pl-3 font-mono text-xs italic leading-relaxed text-stone-500 dark:border-stone-700 dark:text-stone-400">
        &ldquo;{clause.exactQuote}&rdquo;
      </blockquote>

      <p className="mt-3 text-[13px] leading-relaxed text-stone-700 dark:text-stone-200">
        {clause.plainEnglishExplanation}
      </p>

      <p className="mt-2.5 text-[13px] leading-relaxed text-stone-700 dark:text-stone-200">
        <span className="font-semibold text-stone-900 dark:text-stone-50">Why this is flagged — </span>
        {clause.potentialGotcha}
      </p>

      <p className="mt-2.5 text-[13px] leading-relaxed text-stone-700 dark:text-stone-200">
        <span className="font-semibold text-stone-900 dark:text-stone-50">Suggested next step — </span>
        {clause.suggestedNegotiationPoint}
      </p>
    </article>
  );
}
