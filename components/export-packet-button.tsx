"use client";

import { buildLawyerBriefingMarkdown, downloadTextFile } from "@/lib/export-packet";
import type { LegalAuditReport } from "@/lib/schemas/legal-audit";

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12m0 0-4-4m4 4 4-4M5 19h14" />
    </svg>
  );
}

export function ExportPacketButton({
  report,
  fileName,
}: {
  report: LegalAuditReport;
  fileName: string;
}) {
  function handleExport() {
    const markdown = buildLawyerBriefingMarkdown(report, fileName);
    downloadTextFile(markdown, `${fileName.replace(/\.[^.]+$/, "")}-attorney-briefing.md`);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="fixed bottom-16 left-4 z-30 flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-900 shadow-diffuse-lg transition-transform duration-150 active:scale-[0.98] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
    >
      <DownloadIcon />
      Download attorney briefing
    </button>
  );
}
