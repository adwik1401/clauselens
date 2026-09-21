"use client";

import { useRef, useState } from "react";

const SAMPLE_DOCUMENTS = [
  { id: "freelancer-msa", label: "Freelancer MSA", file: "freelancer-msa.txt" },
  { id: "apartment-lease", label: "Apartment Lease", file: "apartment-lease.txt" },
  { id: "saas-nda", label: "SaaS NDA", file: "saas-nda.txt" },
] as const;

// PDFs are sent to the server as-is for extraction (pdf-parse); plain text
// (typed samples or .txt files) is sent directly, skipping a redundant
// round-trip. The parent decides how to call /api/analyze from this shape.
export type DocumentInput =
  | { kind: "file"; file: File }
  | { kind: "text"; text: string; fileName: string };

type DocumentUploadProps = {
  disabled?: boolean;
  onDocumentReady: (input: DocumentInput) => void;
};

// Inline SVG, no icon library dependency — a document-with-corner-fold
// glyph at a consistent 1.5px stroke, matching the icon rules without
// adding package weight to the repo.
function DocumentIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M13.5 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V8L13.5 3Z" />
      <path d="M13.5 3v4.5A1.5 1.5 0 0 0 15 9h3.5" />
      <path d="M9 13h6M9 16.5h4" />
    </svg>
  );
}

export function DocumentUpload({ disabled, onDocumentReady }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const isPlainText = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
    if (isPlainText) {
      file.text().then((text) => onDocumentReady({ kind: "text", text, fileName: file.name }));
    } else {
      onDocumentReady({ kind: "file", file });
    }
  }

  async function handleSample(sample: (typeof SAMPLE_DOCUMENTS)[number]) {
    setLoadingSample(sample.id);
    try {
      const res = await fetch(`/samples/${sample.file}`);
      const text = await res.text();
      onDocumentReady({ kind: "text", text, fileName: sample.label });
    } finally {
      setLoadingSample(null);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => !disabled && e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center transition-all duration-200 ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${
          isDragging
            ? "border-accent bg-accent/[0.04] shadow-diffuse"
            : "border-stone-300 bg-white shadow-diffuse-sm hover:border-stone-400 hover:shadow-diffuse dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-600"
        }`}
      >
        <div className="text-stone-400 dark:text-stone-500">
          <DocumentIcon />
        </div>
        <p className="mt-3 text-sm font-medium text-stone-900 dark:text-stone-50">
          Drop a contract or legal document here
        </p>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          .txt, .pdf — or pick a sample below
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.pdf"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {SAMPLE_DOCUMENTS.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => handleSample(sample)}
            disabled={disabled || loadingSample !== null}
            className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 shadow-diffuse-sm transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            {loadingSample === sample.id ? "Loading…" : sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}
