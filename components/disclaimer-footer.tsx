function WarningIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" />
    </svg>
  );
}

// Layer 2 of the three-layer guardrail: a persistent, always-visible
// reminder that stays on screen throughout the results view (unlike the
// one-time entry modal, which only appears once).
export function DisclaimerFooter() {
  return (
    <div
      role="note"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/90 px-4 py-2 text-center text-xs text-stone-600 shadow-diffuse backdrop-blur-sm dark:border-stone-800 dark:bg-stone-950/90 dark:text-stone-400"
    >
      <span className="inline-flex items-center gap-1.5 text-risk-medium">
        <WarningIcon />
      </span>{" "}
      AI Assistant Notice: For informational &amp; educational purposes only.
      Verify all findings with a licensed legal practitioner.
    </div>
  );
}
