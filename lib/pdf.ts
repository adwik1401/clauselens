// Server-only PDF text extraction. pdf-parse is pure JS (no native
// binaries), which keeps the deployed bundle small and Vercel-friendly.
import pdfParse from "pdf-parse";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text;
}
