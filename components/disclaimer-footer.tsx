// Layer 2 of the three-layer guardrail: a persistent, always-visible
// reminder that stays on screen throughout the results view (unlike the
// one-time entry modal, which only appears once).
export function DisclaimerFooter() {
  return (
    <div
      role="note"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950 dark:text-amber-200"
    >
      ⚠️ AI Assistant Notice: For informational & educational purposes only.
      Verify all findings with a licensed legal practitioner.
    </div>
  );
}
