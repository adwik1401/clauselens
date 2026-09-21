import type { ClauseRisk } from "@/lib/schemas/legal-audit";

const STYLES: Record<ClauseRisk["riskLevel"], string> = {
  CRITICAL: "bg-risk-critical/10 text-risk-critical border-risk-critical/25 dark:bg-risk-critical/15",
  HIGH: "bg-risk-high/10 text-risk-high border-risk-high/25 dark:bg-risk-high/15",
  MEDIUM: "bg-risk-medium/10 text-risk-medium border-risk-medium/25 dark:bg-risk-medium/15",
  LOW: "bg-risk-low/10 text-risk-low border-risk-low/25 dark:bg-risk-low/15",
};

const LABELS: Record<ClauseRisk["riskLevel"], string> = {
  CRITICAL: "Critical risk",
  HIGH: "High risk",
  MEDIUM: "Attention needed",
  LOW: "Standard",
};

// Severity is encoded by color AND label text together, never color alone —
// keeps the signal legible for colorblind users and in grayscale printouts
// of the attorney briefing sheet.
export function RiskBadge({ level }: { level: ClauseRisk["riskLevel"] }) {
  return (
    <span
      role="status"
      aria-label={`Risk level: ${LABELS[level]}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${STYLES[level]}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {LABELS[level]}
    </span>
  );
}
