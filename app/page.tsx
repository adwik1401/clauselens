"use client";

import { useState } from "react";
import { DisclaimerModal } from "@/components/disclaimer-modal";
import { DisclaimerFooter } from "@/components/disclaimer-footer";
import { DocumentUpload, type DocumentInput } from "@/components/document-upload";
import { RiskDashboard } from "@/components/risk-dashboard";
import { QaChat } from "@/components/qa-chat";
import { ExportPacketButton } from "@/components/export-packet-button";
import { analyzeDocument, type AnalyzeResult } from "@/lib/api-client";

export default function Home() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastInput, setLastInput] = useState<DocumentInput | null>(null);

  async function handleDocumentReady(input: DocumentInput) {
    setFileName(input.kind === "file" ? input.file.name : input.fileName);
    setLastInput(input);
    setStatus("loading");
    setErrorMessage("");
    try {
      const analyzeResult = await analyzeDocument(input);
      setResult(analyzeResult);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Analysis failed.");
    }
  }

  if (result) {
    return (
      <main className="min-h-screen pb-10 pt-8">
        <RiskDashboard report={result.report} documentText={result.documentText} fileName={fileName} />
        <QaChat documentText={result.documentText} />
        <ExportPacketButton report={result.report} fileName={fileName} />
        <DisclaimerFooter />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16">
      {!acknowledged && (
        <DisclaimerModal onAcknowledge={() => setAcknowledged(true)} />
      )}

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          ClauseLens
        </h1>
        <p className="mt-2 max-w-md text-sm text-neutral-600 dark:text-neutral-300">
          Upload a contract or legal document to get a plain-language
          breakdown, clause-level risk flags, and a briefing pack you can
          bring to a lawyer.
        </p>
      </div>

      <DocumentUpload disabled={status === "loading"} onDocumentReady={handleDocumentReady} />

      {status === "loading" && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400" role="status">
          Analyzing &ldquo;{fileName}&rdquo;… this can take up to 30 seconds for longer documents.
        </p>
      )}
      {status === "error" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {errorMessage}
          </p>
          {lastInput && (
            <button
              type="button"
              onClick={() => handleDocumentReady(lastInput)}
              className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </main>
  );
}
