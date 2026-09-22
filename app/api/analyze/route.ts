import { NextResponse } from "next/server";
import { classifyGeminiError, getGemini, GEMINI_MODEL, withGeminiRetry } from "@/lib/gemini";
import { extractPdfText } from "@/lib/pdf";
import { isValidPdf } from "@/lib/file-validation";
import { sanitizePII } from "@/lib/pii";
import { parseClauseBlocks, renderClauseOutline } from "@/lib/clause-parser";
import { buildAnalysisPrompt, LEGAL_ANALYSIS_SYSTEM_PROMPT } from "@/lib/prompts";
import { AnalyzeRequestSchema, LegalAuditReportSchema } from "@/lib/schemas/legal-audit";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCachedAnalysis, hashDocument, setCachedAnalysis } from "@/lib/cache";

export const runtime = "nodejs"; // pdf-parse needs the Node runtime, not edge

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB — generous for a contract PDF, cheap to reject earlier

// GenAI integration point: this route is the single call site for document
// analysis. It resolves raw input (uploaded file or pasted text) into plain
// text, then makes one structured Gemini call and validates the response
// against LegalAuditReportSchema before it ever reaches the client.
export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(getClientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let rawText: string;
  let fileName: string | undefined;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const textField = formData.get("text");

    if (file instanceof Blob) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "File is too large (8MB limit)." }, { status: 413 });
      }
      fileName = "name" in file ? (file as File).name : undefined;
      const buffer = Buffer.from(await file.arrayBuffer());
      const looksLikePdf = fileName?.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

      if (looksLikePdf) {
        // Validate actual content, not just the extension/MIME type the
        // browser reported — both are client-controlled.
        if (!isValidPdf(buffer)) {
          return NextResponse.json(
            { error: "File is named or typed as a PDF but doesn't contain valid PDF content." },
            { status: 400 }
          );
        }
        rawText = await extractPdfText(buffer);
      } else {
        rawText = buffer.toString("utf-8");
      }
    } else if (typeof textField === "string") {
      rawText = textField;
      fileName = typeof formData.get("fileName") === "string" ? String(formData.get("fileName")) : undefined;
    } else {
      return NextResponse.json({ error: "Provide a 'file' or 'text' field." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded document." }, { status: 400 });
  }

  const sanitized = sanitizePII(rawText);

  const parsedRequest = AnalyzeRequestSchema.safeParse({ text: sanitized, fileName });
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "Invalid document.", details: parsedRequest.error.flatten() },
      { status: 400 }
    );
  }

  // Re-analyzing an identical document (retry, re-clicked sample, demo
  // re-run) is common — skip the Gemini call entirely on a cache hit.
  const documentHash = hashDocument(parsedRequest.data.text);
  const cached = await getCachedAnalysis(documentHash);
  if (cached) {
    return NextResponse.json({ report: cached.report, documentText: cached.documentText });
  }

  const clauseOutline = renderClauseOutline(parseClauseBlocks(parsedRequest.data.text));
  const documentForPrompt = clauseOutline.length > 0 ? clauseOutline : parsedRequest.data.text;

  try {
    const response = await withGeminiRetry(() =>
      getGemini().models.generateContent({
        model: GEMINI_MODEL,
        config: {
          systemInstruction: LEGAL_ANALYSIS_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
        contents: buildAnalysisPrompt(documentForPrompt, parsedRequest.data.fileName),
      })
    );

    const raw = response.text;
    if (!raw) {
      return NextResponse.json({ error: "The model returned an empty response." }, { status: 502 });
    }

    const parsedJson = JSON.parse(raw);
    const report = LegalAuditReportSchema.safeParse(parsedJson);

    if (!report.success) {
      return NextResponse.json(
        { error: "The model's response did not match the expected structure.", details: report.error.flatten() },
        { status: 502 }
      );
    }

    await setCachedAnalysis(documentHash, report.data, parsedRequest.data.text);
    return NextResponse.json({ report: report.data, documentText: parsedRequest.data.text });
  } catch (error) {
    console.error("[api/analyze] Gemini request failed:", error);
    const { status, message } = classifyGeminiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
