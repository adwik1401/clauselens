import type { DocumentInput } from "@/components/document-upload";
import type { LegalAuditReport } from "@/lib/schemas/legal-audit";

export type AnalyzeResult = { report: LegalAuditReport; documentText: string };

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2500;

// The server routes already retry once internally for a transient Gemini
// 503, but under sustained high demand that isn't always enough — and
// stacking more retries inside one serverless invocation risks hitting its
// execution time limit. Retrying from the browser instead starts a fresh
// function invocation each time, so each attempt gets its own full time
// budget. Only retries on 503 (the routes' signal for "transient, worth
// retrying"); any other failure surfaces immediately.
async function fetchWithRetry(
  makeRequest: () => Promise<Response>,
  onRetry?: (attempt: number, maxAttempts: number) => void
): Promise<unknown> {
  let lastError = "Request failed.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await makeRequest();
    const data = await res.json();

    if (res.ok) return data;

    lastError = data.error ?? lastError;
    const isRetryable = res.status === 503;
    const hasAttemptsLeft = attempt < MAX_ATTEMPTS;

    if (!isRetryable || !hasAttemptsLeft) {
      throw new Error(lastError);
    }

    onRetry?.(attempt + 1, MAX_ATTEMPTS);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }

  throw new Error(lastError);
}

export async function analyzeDocument(
  input: DocumentInput,
  onRetry?: (attempt: number, maxAttempts: number) => void
): Promise<AnalyzeResult> {
  const formData = new FormData();
  if (input.kind === "file") {
    formData.set("file", input.file);
  } else {
    formData.set("text", input.text);
    formData.set("fileName", input.fileName);
  }

  const data = await fetchWithRetry(
    () => fetch("/api/analyze", { method: "POST", body: formData }),
    onRetry
  );
  return data as AnalyzeResult;
}

export async function askQuestion(
  documentText: string,
  question: string,
  onRetry?: (attempt: number, maxAttempts: number) => void
): Promise<string> {
  const data = await fetchWithRetry(
    () =>
      fetch("/api/chat-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText, question }),
      }),
    onRetry
  );
  return (data as { answer: string }).answer;
}
