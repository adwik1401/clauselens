import { NextResponse } from "next/server";
import { z } from "zod";
import { getGemini, GEMINI_MODEL } from "@/lib/gemini";
import { buildQaPrompt } from "@/lib/prompts";

const ChatRequestSchema = z.object({
  documentText: z.string().min(20),
  question: z.string().min(3).max(500),
});

// GenAI integration point: grounded Q&A over the already-loaded document.
// The document text never leaves the client until this call, and the
// question is answered strictly from that text (see buildQaPrompt).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const response = await getGemini().models.generateContent({
      model: GEMINI_MODEL,
      config: { temperature: 0.1 },
      contents: buildQaPrompt(parsed.data.documentText, parsed.data.question),
    });

    const answer = response.text;
    if (!answer) {
      return NextResponse.json({ error: "The model returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("[api/chat-doc] Gemini request failed:", error);
    return NextResponse.json({ error: "Could not answer that question. Please try again." }, { status: 500 });
  }
}
