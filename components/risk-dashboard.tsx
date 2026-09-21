import { DocumentViewer } from "@/components/document-viewer";
import { RiskCard } from "@/components/risk-card";
import type { LegalAuditReport } from "@/lib/schemas/legal-audit";

function riskScoreColor(score: number): string {
  if (score >= 70) return "text-risk-critical";
  if (score >= 40) return "text-risk-high";
  if (score >= 15) return "text-risk-medium";
  return "text-risk-low";
}

function riskScoreBarColor(score: number): string {
  if (score >= 70) return "bg-risk-critical";
  if (score >= 40) return "bg-risk-high";
  if (score >= 15) return "bg-risk-medium";
  return "bg-risk-low";
}

type RiskDashboardProps = {
  report: LegalAuditReport;
  documentText: string;
  fileName: string;
};

// Editorial-split results screen: a masthead summary card, then document
// text with inline highlights on the left, structured risk analysis on
// the right.
export function RiskDashboard({ report, documentText, fileName }: RiskDashboardProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 md:px-8">
      <header className="animate-fade-up mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-diffuse-sm dark:border-stone-800 dark:bg-stone-900">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
          {fileName} · {report.contractType}
          {report.governingLaw ? ` · Governed by ${report.governingLaw}` : ""}
        </p>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">
            {report.executiveSummary}
          </p>

          <div className="shrink-0 sm:w-40">
            <div className="flex items-baseline gap-1.5">
              <span className={`font-heading text-4xl font-bold tracking-tightest ${riskScoreColor(report.overallRiskScore)}`}>
                {report.overallRiskScore}
              </span>
              <span className="text-xs text-stone-400 dark:text-stone-500">/ 100</span>
            </div>
            <p className="mt-0.5 text-xs uppercase tracking-wide text-stone-400 dark:text-stone-500">
              Overall risk
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <div
                className={`h-full rounded-full transition-all duration-700 ${riskScoreBarColor(report.overallRiskScore)}`}
                style={{ width: `${Math.min(100, Math.max(0, report.overallRiskScore))}%` }}
                role="img"
                aria-label={`Risk meter at ${report.overallRiskScore} out of 100`}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-label="Full document text" className="h-[70vh]">
          <DocumentViewer documentText={documentText} clauses={report.flaggedClauses} />
        </section>

        <section aria-label="Flagged risks and analysis" className="flex h-[70vh] flex-col gap-6 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-diffuse-sm dark:border-stone-800 dark:bg-stone-900">
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400 dark:text-stone-500">
                Rights granted to you
              </h2>
              <ul className="mt-2.5 flex flex-col gap-2 text-[13px] leading-snug text-stone-700 dark:text-stone-200">
                {report.keyRightsGranted.map((right, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-risk-low" />
                    {right}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-diffuse-sm dark:border-stone-800 dark:bg-stone-900">
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400 dark:text-stone-500">
                Obligations you&apos;re assuming
              </h2>
              <ul className="mt-2.5 flex flex-col gap-2 text-[13px] leading-snug text-stone-700 dark:text-stone-200">
                {report.keyObligationsAssumed.map((obligation, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-risk-high" />
                    {obligation}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400 dark:text-stone-500">
              Flagged clauses ({report.flaggedClauses.length})
            </h2>
            {report.flaggedClauses.map((clause, i) => (
              <RiskCard key={i} clause={clause} index={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
