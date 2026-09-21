"use client";

import { useRef, useState } from "react";

const SAMPLE_DOCUMENTS = [
  { id: "freelancer-msa", label: "Freelancer MSA", file: "freelancer-msa.txt" },
  { id: "apartment-lease", label: "Apartment Lease", file: "apartment-lease.txt" },
  { id: "saas-nda", label: "SaaS NDA", file: "saas-nda.txt" },
] as const;

type DocumentUploadProps = {
  onDocumentReady: (text: string, fileName: string) => void;
};

// Upload shell for Phase 1: accepts a dropped/selected file or a one-click
// sample document. PDF text extraction and the analysis call are wired in
// Phase 2 (/api/analyze) — this component only resolves plain text.
export function DocumentUpload({ onDocumentReady }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const text = await file.text();
    onDocumentReady(text, file.name);
  }

  async function handleSample(sample: (typeof SAMPLE_DOCUMENTS)[number]) {
    setLoadingSample(sample.id);
    try {
      const res = await fetch(`/samples/${sample.file}`);
      const text = await res.text();
      onDocumentReady(text, sample.label);
    } finally {
      setLoadingSample(null);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
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
            disabled={loadingSample !== null}
            className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {loadingSample === sample.id ? "Loading…" : sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}
