"use client";

import { useState } from "react";

type DisclaimerModalProps = {
  onAcknowledge: () => void;
};

// Layer 1 of the three-layer guardrail: an explicit, blocking acknowledgment
// before any document leaves the user's browser. Satisfies the case study's
// "Legal Boundary" requirement — this tool informs, it does not advise.
export function DisclaimerModal({ onAcknowledge }: DisclaimerModalProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <h2
          id="disclaimer-title"
          className="text-lg font-semibold text-neutral-900 dark:text-neutral-50"
        >
          Legal Information, Not Legal Counsel
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          This tool uses Artificial Intelligence to analyze document text and
          assist your comprehension. It does not provide legal advice, cannot
          evaluate legal enforceability under localized state statutes, and
          does not create an attorney-client relationship. Always consult a
          qualified attorney for critical legal transactions.
        </p>
        <label className="mt-5 flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-200">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          I understand this is for informational purposes only.
        </label>
        <button
          type="button"
          disabled={!checked}
          onClick={onAcknowledge}
          className="mt-5 w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          Continue to Analyze Document
        </button>
      </div>
    </div>
  );
}
