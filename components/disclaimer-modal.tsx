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
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 px-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-md animate-fade-up rounded-2xl border border-stone-200 bg-white p-7 shadow-diffuse-lg dark:border-stone-800 dark:bg-stone-900">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
          Before you begin
        </span>
        <h2
          id="disclaimer-title"
          className="mt-2 font-heading text-xl font-semibold tracking-tightest text-stone-900 dark:text-stone-50"
        >
          Legal information, not legal counsel
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          This tool uses artificial intelligence to analyze document text and
          assist your comprehension. It does not provide legal advice, cannot
          evaluate legal enforceability under localized state statutes, and
          does not create an attorney-client relationship. Always consult a
          qualified attorney for critical legal transactions.
        </p>
        <label className="mt-6 flex items-start gap-2.5 text-sm text-stone-700 dark:text-stone-200">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-accent accent-accent"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          I understand this is for informational purposes only.
        </label>
        <button
          type="button"
          disabled={!checked}
          onClick={onAcknowledge}
          className="mt-6 w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 dark:disabled:bg-stone-800 dark:disabled:text-stone-600"
        >
          Continue to analyze document
        </button>
      </div>
    </div>
  );
}
