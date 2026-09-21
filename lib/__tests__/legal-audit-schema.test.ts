import { describe, expect, it } from "vitest";
import {
  AnalyzeRequestSchema,
  ClauseRiskSchema,
  LegalAuditReportSchema,
} from "@/lib/schemas/legal-audit";

const validClause = {
  clauseTitle: "Indemnification",
  sectionNumber: "4.1",
  exactQuote: "Contractor shall indemnify, defend, and hold harmless Client.",
  riskLevel: "HIGH" as const,
  plainEnglishExplanation: "You must cover the client's legal costs.",
  potentialGotcha: "This obligation is one-sided.",
  suggestedNegotiationPoint: "Request a mutual indemnification clause.",
};

const validReport = {
  contractType: "Freelancer MSA",
  governingLaw: "Delaware",
  overallRiskScore: 65,
  executiveSummary: "This contract has several one-sided clauses.",
  keyRightsGranted: ["Right to payment"],
  keyObligationsAssumed: ["Deliver services as specified"],
  flaggedClauses: [validClause],
  questionsForLawyer: ["Is the indemnification clause enforceable in my state?"],
  actionChecklist: [
    { task: "Review indemnification clause", deadlineOrCondition: "Before signing", urgency: "URGENT" as const },
  ],
};

describe("ClauseRiskSchema", () => {
  it("accepts a well-formed clause", () => {
    expect(ClauseRiskSchema.safeParse(validClause).success).toBe(true);
  });

  it("rejects an invalid riskLevel", () => {
    const result = ClauseRiskSchema.safeParse({ ...validClause, riskLevel: "SEVERE" });
    expect(result.success).toBe(false);
  });
});

describe("LegalAuditReportSchema", () => {
  it("accepts a well-formed report", () => {
    expect(LegalAuditReportSchema.safeParse(validReport).success).toBe(true);
  });

  it("rejects a risk score outside 0-100", () => {
    const result = LegalAuditReportSchema.safeParse({ ...validReport, overallRiskScore: 150 });
    expect(result.success).toBe(false);
  });

  it("accepts a null governingLaw", () => {
    const result = LegalAuditReportSchema.safeParse({ ...validReport, governingLaw: null });
    expect(result.success).toBe(true);
  });

  it("rejects a report missing flaggedClauses", () => {
    const withoutClauses: Partial<typeof validReport> = { ...validReport };
    delete withoutClauses.flaggedClauses;
    const result = LegalAuditReportSchema.safeParse(withoutClauses);
    expect(result.success).toBe(false);
  });
});

describe("AnalyzeRequestSchema", () => {
  it("rejects text shorter than the minimum length", () => {
    expect(AnalyzeRequestSchema.safeParse({ text: "too short" }).success).toBe(false);
  });

  it("accepts sufficiently long text with an optional fileName", () => {
    const result = AnalyzeRequestSchema.safeParse({
      text: "A".repeat(25),
      fileName: "lease.pdf",
    });
    expect(result.success).toBe(true);
  });
});
