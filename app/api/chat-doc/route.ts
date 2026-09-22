import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyGeminiError, getGemini, GEMINI_MODEL, withGeminiRetry } from "@/lib/gemini";
import { buildQaPrompt } from "@/lib/prompts";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ChatRequestSchema = z.object({
  documentText: z.string().min(20),
  question: z.string().min(3).max(500),
});

// GenAI integration point: grounded Q&A over the already-loaded document.
// The document text never leaves the client until this call, and the
// question is answered strictly from that text (see buildQaPrompt).
//
// Streamed rather than buffered: this is free-form prose (unlike /api/analyze,
// which must be complete, Zod-validated JSON before it's usable), so there's
// no reason to hold the full answer server-side before the client sees any
// of it. Tokens are forwarded to the browser as Gemini produces them.
export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(getClientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let geminiStream: AsyncGenerator<{ text?: string }>;
  try {
    // withGeminiRetry retries the *opening* call (obtaining the stream), not
    // anything mid-stream — a 503/429 here still surfaces as a clean JSON
    // error response, since no bytes have reached the client yet. Once
    // streaming begins, errors can only end the stream early (see below).
    geminiStream = await withGeminiRetry(() =>
      getGemini().models.generateContentStream({
        model: GEMINI_MODEL,
        config: { temperature: 0.1 },
        contents: buildQaPrompt(parsed.data.documentText, parsed.data.question),
      })
    );
  } catch (error) {
    console.error("[api/chat-doc] Gemini stream failed to start:", error);
    const { status, message } = classifyGeminiError(error);
    return NextResponse.json({ error: message }, { status });
  }

  const encoder = new TextEncoder();
  const body_ = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of geminiStream) {
          if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
        }
      } catch (error) {
        console.error("[api/chat-doc] Gemini stream failed mid-response:", error);
        // Headers are already sent at this point; end the stream rather than
        // fail the request. The client sees whatever text arrived.
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body_, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
