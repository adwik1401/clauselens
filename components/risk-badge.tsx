import type { ClauseRisk } from "@/lib/schemas/legal-audit";

const STYLES: Record<ClauseRisk["riskLevel"], string> = {
  CRITICAL: "bg-risk-critical/10 text-risk-critical border-risk-critical/30",
  HIGH: "bg-risk-high/10 text-risk-high border-risk-high/30",
  MEDIUM: "bg-risk-medium/10 text-risk-medium border-risk-medium/30",
  LOW: "bg-risk-low/10 text-risk-low border-risk-low/30",
};

const LABELS: Record<ClauseRisk["riskLevel"], string> = {
  CRITICAL: "Critical Risk",
  HIGH: "High Risk",
  MEDIUM: "Attention Needed",
  LOW: "Standard",
};

export function RiskBadge({ level }: { level: ClauseRisk["riskLevel"] }) {
  return (
    <span
      role="status"
      aria-label={`Risk level: ${LABELS[level]}`}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[level]}`}
    >
      {LABELS[level]}
    </span>
  );
}
