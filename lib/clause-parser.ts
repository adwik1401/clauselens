// Splits a legal document into structural blocks by heading pattern
// (SECTION, ARTICLE, numbered clauses, lettered sub-clauses). This keeps
// each clause intact as a single unit instead of chunking by arbitrary
// token windows, which is what lets the LLM quote a clause exactly and
// lets the UI jump straight to it later.

export type ClauseBlock = {
  heading: string | null;
  text: string;
  charOffset: number;
};

const HEADING_PATTERN = /^(SECTION|ARTICLE)\s+[\d.]+.*$|^\d+(\.\d+)*\.?\s+.+$|^\([a-z]\)\s+.+$/im;

export function parseClauseBlocks(documentText: string): ClauseBlock[] {
  const lines = documentText.split("\n");
  const blocks: ClauseBlock[] = [];

  let currentHeading: string | null = null;
  let currentLines: string[] = [];
  let currentOffset = 0;
  let runningOffset = 0;

  const flush = () => {
    const text = currentLines.join("\n").trim();
    if (text.length > 0) {
      blocks.push({ heading: currentHeading, text, charOffset: currentOffset });
    }
    currentLines = [];
  };

  for (const line of lines) {
    if (HEADING_PATTERN.test(line.trim())) {
      flush();
      currentHeading = line.trim();
      currentOffset = runningOffset;
    }
    currentLines.push(line);
    runningOffset += line.length + 1; // +1 for the stripped newline
  }
  flush();

  return blocks;
}

// Renders clause blocks back into a numbered outline the LLM can reference
// verbatim in its system prompt, cheaper than sending structured JSON.
export function renderClauseOutline(blocks: ClauseBlock[]): string {
  return blocks
    .map((block, i) => `[Block ${i + 1}]${block.heading ? ` ${block.heading}` : ""}\n${block.text}`)
    .join("\n\n");
}
