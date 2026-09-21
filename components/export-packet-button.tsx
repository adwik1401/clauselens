"use client";

import { buildLawyerBriefingMarkdown, downloadTextFile } from "@/lib/export-packet";
import type { LegalAuditReport } from "@/lib/schemas/legal-audit";

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
      className="fixed bottom-14 left-4 z-30 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
    >
      Download Attorney Briefing
    </button>
  );
}
