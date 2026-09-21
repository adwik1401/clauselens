import { DocumentViewer } from "@/components/document-viewer";
import { RiskCard } from "@/components/risk-card";
import type { LegalAuditReport } from "@/lib/schemas/legal-audit";

function riskScoreColor(score: number): string {
  if (score >= 70) return "text-risk-critical";
  if (score >= 40) return "text-risk-high";
  if (score >= 15) return "text-risk-medium";
  return "text-risk-low";
}

type RiskDashboardProps = {
  report: LegalAuditReport;
  documentText: string;
  fileName: string;
};

// Phase 3 split-view results screen: document text with inline highlights
// on the left, structured risk analysis on the right.
export function RiskDashboard({ report, documentText, fileName }: RiskDashboardProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {fileName} · {report.contractType}
          {report.governingLaw ? ` · Governed by ${report.governingLaw}` : ""}
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${riskScoreColor(report.overallRiskScore)}`}>
            {report.overallRiskScore}
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">/ 100 overall risk score</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-neutral-700 dark:text-neutral-200">
          {report.executiveSummary}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-label="Full document text" className="h-[70vh]">
          <DocumentViewer documentText={documentText} clauses={report.flaggedClauses} />
        </section>

        <section aria-label="Flagged risks and analysis" className="flex h-[70vh] flex-col gap-6 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
              <h2 className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                Rights Granted To You
              </h2>
              <ul className="mt-1 list-inside list-disc text-sm text-neutral-700 dark:text-neutral-200">
                {report.keyRightsGranted.map((right, i) => (
                  <li key={i}>{right}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
              <h2 className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                Obligations You&apos;re Assuming
              </h2>
              <ul className="mt-1 list-inside list-disc text-sm text-neutral-700 dark:text-neutral-200">
                {report.keyObligationsAssumed.map((obligation, i) => (
                  <li key={i}>{obligation}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
              Flagged Clauses ({report.flaggedClauses.length})
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
