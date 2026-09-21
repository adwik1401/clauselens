import { z } from "zod";

// One flagged clause: always anchored to a verbatim quote from the source
// document so the UI can highlight the exact text and the model can't
// invent a clause that isn't actually there.
export const ClauseRiskSchema = z.object({
  clauseTitle: z.string().describe("Standardized title, e.g. 'Indemnification'"),
  sectionNumber: z
    .string()
    .describe("Exact section number/label from the text, e.g. '4.1'"),
  exactQuote: z
    .string()
    .describe("Exact verbatim substring copied from the source document"),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  plainEnglishExplanation: z
    .string()
    .describe("8th-grade reading level explanation of what this clause means"),
  potentialGotcha: z
    .string()
    .describe("The hidden liability, trap, or asymmetric burden in this clause"),
  suggestedNegotiationPoint: z
    .string()
    .describe("Actionable redline request or counter-proposal"),
});
export type ClauseRisk = z.infer<typeof ClauseRiskSchema>;

export const ActionChecklistItemSchema = z.object({
  task: z.string(),
  deadlineOrCondition: z.string(),
  urgency: z.enum(["URGENT", "IMPORTANT", "OPTIONAL"]),
});

// Full structured output of a single /api/analyze call.
export const LegalAuditReportSchema = z.object({
  contractType: z
    .string()
    .describe("Identified contract type, e.g. NDA, Lease, SaaS MSA"),
  governingLaw: z.string().nullable(),
  overallRiskScore: z.number().min(0).max(100),
  executiveSummary: z.string().describe("3-bullet plain-language summary"),
  keyRightsGranted: z.array(z.string()),
  keyObligationsAssumed: z.array(z.string()),
  flaggedClauses: z.array(ClauseRiskSchema),
  questionsForLawyer: z.array(z.string()).min(1).max(10),
  actionChecklist: z.array(ActionChecklistItemSchema),
});
export type LegalAuditReport = z.infer<typeof LegalAuditReportSchema>;

// Request body for /api/analyze — raw document text plus its filename for
// context. PDF-to-text extraction and PII sanitization happen before this.
export const AnalyzeRequestSchema = z.object({
  text: z
    .string()
    .min(20, "Document text is too short to analyze")
    .max(500_000, "Document text is too long to analyze"),
  fileName: z.string().optional(),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
