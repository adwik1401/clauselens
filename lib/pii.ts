// Lightweight, regex-based PII masking applied before document text is sent
// to the LLM. This is a best-effort reduction of exposure, not a compliance
// guarantee — legal documents routinely contain names that regex can't
// reliably detect, so this only strips high-confidence patterns.

const PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "[EMAIL]", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { label: "[PHONE]", regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
  { label: "[SSN]", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  { label: "[CARD]", regex: /\b(?:\d[ -]*?){13,16}\b/g },
];

export function sanitizePII(text: string): string {
  return PATTERNS.reduce(
    (acc, { label, regex }) => acc.replace(regex, label),
    text
  );
}
