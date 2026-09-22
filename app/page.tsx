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
  const [retryStatus, setRetryStatus] = useState<string | null>(null);

  async function handleDocumentReady(input: DocumentInput) {
    setFileName(input.kind === "file" ? input.file.name : input.fileName);
    setLastInput(input);
    setStatus("loading");
    setErrorMessage("");
    setRetryStatus(null);
    try {
      const analyzeResult = await analyzeDocument(input, (attempt, max) =>
        setRetryStatus(`The AI service is busy — retrying (attempt ${attempt} of ${max})…`)
      );
      setResult(analyzeResult);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setRetryStatus(null);
    }
  }

  if (result) {
    return (
      <main className="min-h-[100dvh] pb-10 pt-8">
        <RiskDashboard report={result.report} documentText={result.documentText} fileName={fileName} />
        <QaChat documentText={result.documentText} />
        <ExportPacketButton report={result.report} fileName={fileName} />
        <DisclaimerFooter />
      </main>
    );
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      {/* Ambient background accent — fixed, low-opacity, never intercepts input */}
      <div aria-hidden="true" className="ambient-accent pointer-events-none fixed inset-0 z-0" />

      {!acknowledged && (
        <DisclaimerModal onAcknowledge={() => setAcknowledged(true)} />
      )}

      <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 md:grid-cols-[1.1fr_1fr] md:gap-16 md:px-8">
        <div className="animate-fade-up">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
            Legal document intelligence
          </span>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-[1.05] tracking-tightest text-stone-900 dark:text-stone-50 sm:text-5xl">
            Read the fine print
            <br />
            before it reads you.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-stone-600 dark:text-stone-400">
            Upload a contract or legal document and get a plain-language
            breakdown, clause-level risk flags anchored to the exact source
            text, and a briefing pack you can bring to a lawyer.
          </p>
          <ul className="mt-8 flex flex-col gap-2.5 text-sm text-stone-500 dark:text-stone-500">
            {[
              "Every flagged clause is quoted verbatim, never paraphrased",
              "Ask follow-up questions grounded only in your document",
              "Export a one-click attorney briefing sheet",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-up [animation-delay:120ms]">
          <DocumentUpload disabled={status === "loading"} onDocumentReady={handleDocumentReady} />

          <div className="mt-4 min-h-6 text-center">
            {status === "loading" && (
              <p className="text-sm text-stone-500 dark:text-stone-400" role="status">
                {retryStatus ?? `Analyzing "${fileName}"… this can take up to 30 seconds for longer documents.`}
              </p>
            )}
            {status === "error" && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-risk-critical" role="alert">
                  {errorMessage}
                </p>
                {lastInput && (
                  <button
                    type="button"
                    onClick={() => handleDocumentReady(lastInput)}
                    className="rounded-full border border-stone-300 px-3.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
