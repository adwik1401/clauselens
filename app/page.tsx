"use client";

import { useState } from "react";
import { DisclaimerModal } from "@/components/disclaimer-modal";
import { DocumentUpload } from "@/components/document-upload";

export default function Home() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [document, setDocument] = useState<{ text: string; name: string } | null>(
    null
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16">
      {!acknowledged && (
        <DisclaimerModal onAcknowledge={() => setAcknowledged(true)} />
      )}

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          ClauseLens
        </h1>
        <p className="mt-2 max-w-md text-sm text-neutral-600 dark:text-neutral-300">
          Upload a contract or legal document to get a plain-language
          breakdown, clause-level risk flags, and a briefing pack you can
          bring to a lawyer.
        </p>
      </div>

      <DocumentUpload
        onDocumentReady={(text, name) => setDocument({ text, name })}
      />

      {document && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Loaded &ldquo;{document.name}&rdquo; ({document.text.length}{" "}
          characters). Analysis engine arrives in the next phase.
        </p>
      )}
    </main>
  );
}
