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
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${
          isDragging
            ? "border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-800"
            : "border-neutral-300 dark:border-neutral-700"
        }`}
      >
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
          Drop a contract or legal document here
        </p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
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

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {SAMPLE_DOCUMENTS.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => handleSample(sample)}
            disabled={disabled || loadingSample !== null}
            className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {loadingSample === sample.id ? "Loading…" : sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}
