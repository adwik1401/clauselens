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

    // The route always returns JSON, success or failure — so a parse
    // failure here means the platform itself intervened before our code
    // ran (a gateway timeout/error page, typically HTML). That's exactly
    // the kind of transient infra failure worth retrying, same as a 503.
    let data: { error?: string; [key: string]: unknown };
    let parseFailed = false;
    try {
      data = await res.json();
    } catch {
      data = {};
      parseFailed = true;
    }

    if (res.ok && !parseFailed) return data;

    lastError = data.error ?? (parseFailed ? "The server returned an unexpected response." : lastError);
    const isRetryable = parseFailed || res.status === 503;
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

// /api/chat-doc streams its answer (see that route for why) rather than
// returning JSON, so it can't reuse fetchWithRetry as-is: a streamed 200 has
// no JSON body to parse. Retry logic still applies to the request itself —
// only to non-ok responses, before any streaming has started — then the
// success path switches to reading the stream chunk by chunk.
export async function askQuestion(
  documentText: string,
  question: string,
  onChunk?: (textSoFar: string) => void,
  onRetry?: (attempt: number, maxAttempts: number) => void
): Promise<string> {
  let lastError = "Request failed.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch("/api/chat-doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentText, question }),
    });

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        onChunk?.(full);
      }
      return full;
    }

    let data: { error?: string } = {};
    let parseFailed = false;
    try {
      data = await res.json();
    } catch {
      parseFailed = true;
    }

    lastError = data.error ?? (parseFailed ? "The server returned an unexpected response." : lastError);
    const isRetryable = parseFailed || res.status === 503;
    const hasAttemptsLeft = attempt < MAX_ATTEMPTS;

    if (!isRetryable || !hasAttemptsLeft) throw new Error(lastError);

    onRetry?.(attempt + 1, MAX_ATTEMPTS);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }

  throw new Error(lastError);
}
