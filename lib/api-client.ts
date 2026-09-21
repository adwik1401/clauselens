import type { DocumentInput } from "@/components/document-upload";
import type { LegalAuditReport } from "@/lib/schemas/legal-audit";

export type AnalyzeResult = { report: LegalAuditReport; documentText: string };

export async function analyzeDocument(input: DocumentInput): Promise<AnalyzeResult> {
  const formData = new FormData();
  if (input.kind === "file") {
    formData.set("file", input.file);
  } else {
    formData.set("text", input.text);
    formData.set("fileName", input.fileName);
  }

  const res = await fetch("/api/analyze", { method: "POST", body: formData });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Analysis failed.");
  }

  return data as AnalyzeResult;
}
