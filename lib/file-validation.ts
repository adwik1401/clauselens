// Validates actual file content rather than trusting the filename extension
// or browser-supplied MIME type, both of which are client-controlled and
// easy to spoof. A mislabeled or malicious file passed to pdf-parse based
// on extension alone could trigger unexpected parser behavior.
const PDF_MAGIC_BYTES = "%PDF-";

export function isValidPdf(buffer: Buffer): boolean {
  return buffer.subarray(0, PDF_MAGIC_BYTES.length).toString("ascii") === PDF_MAGIC_BYTES;
}
