# ClauseLens

An AI-powered assistant that helps people understand contracts and legal documents before they sign them — plain-language breakdowns, clause-level risk flags, grounded Q&A, and a one-click briefing sheet to bring to an actual lawyer.

Built for **PromptWars: Virtual (Exclusive Edition)** (Hack2skill), theme: *AI for Legal Assistance & Access*.

**Live app:** https://clauselens-793.netlify.app
**Repo:** https://github.com/adwik1401/clauselens

---

## The problem

Legal documents — leases, NDAs, freelance contracts — are full of one-sided clauses most people don't catch until it's too late: auto-renewals with narrow opt-out windows, uncapped indemnification, liability waivers, arbitration clauses that waive your right to a jury. Reading a contract carefully takes a lawyer's training most people don't have, and a real consultation isn't always practical for a routine lease or freelance gig.

## What it does

1. **Upload** a contract (PDF or text) or try one of three built-in samples (freelancer MSA, apartment lease, SaaS NDA).
2. **Get a structured risk analysis**: overall risk score, plain-English executive summary, your rights vs. your obligations, and every risky clause flagged with its exact quote, risk level, why it's risky, and a suggested negotiation point.
3. **Ask follow-up questions** in a chat grounded strictly in the document you uploaded — not general legal trivia.
4. **Download an Attorney Briefing Sheet** — a Markdown summary with the flagged risks and targeted questions, built for a real 30-minute consultation.

Every screen carries a clear disclaimer: this tool informs, it doesn't advise. See [Legal Boundary](#legal-boundary) below.

## GenAI Architecture

This is the required explicit mapping of GenAI services and integration points.

**GenAI service:** Google Gemini (`gemini-3.6-flash`) via the `@google/genai` SDK, called server-side only.

| Integration point | File | What it does |
|---|---|---|
| Document analysis | `app/api/analyze/route.ts` | Single structured Gemini call. Takes the uploaded document (already PDF-extracted and PII-masked), sends it with a system prompt enforcing closed-corpus grounding (every flagged clause must quote the source verbatim) and an adversarial risk checklist, and gets back JSON matching `LegalAuditReportSchema` (Zod-validated before it ever reaches the client). |
| Grounded Q&A | `app/api/chat-doc/route.ts` | A second Gemini call per question, given only the loaded document text and the user's question — answers are constrained to that document, with the model instructed to say so if the answer isn't in the text. |
| System prompt | `lib/prompts.ts` | `LEGAL_ANALYSIS_SYSTEM_PROMPT` defines the persona, the zero-hallucination quote rule, the adversarial risk checklist (non-mutual indemnification, uncapped liability, broad non-competes, IP overreach, auto-renewal traps, mandatory arbitration, one-sided termination), and a prompt-injection guard that treats the uploaded document as data, never as instructions. |

**Data flow:** browser upload → `FormData` to `/api/analyze` → server extracts text (`lib/pdf.ts` for PDFs) → PII masking (`lib/pii.ts`) → clause-boundary structuring (`lib/clause-parser.ts`) → single Gemini call with the full document in context (no vector DB — Gemini's long context window handles a full contract in one pass) → Zod-validated JSON response → rendered client-side with quote highlighting (`lib/highlight.ts`) linking each risk card back to its exact location in the source text.

**Why no RAG/vector DB:** contracts in this use case are short enough (a few pages to tens of pages) to fit entirely in Gemini's context window. A single full-document call gives the model complete context for cross-clause reasoning (e.g. spotting a clause that contradicts an earlier one) that chunked retrieval would lose, while keeping the repo small and the architecture simple for a 5-day solo build.

## Legal Boundary

This tool provides information, not legal advice, and does not create an attorney-client relationship. Guardrails appear at three layers:

1. **Entry modal** — a blocking acknowledgment before any document is analyzed (`components/disclaimer-modal.tsx`).
2. **Persistent footer** — visible throughout the results view (`components/disclaimer-footer.tsx`).
3. **Per-clause badges** — every flagged risk is labeled with its severity, not asserted as a legal conclusion (`components/risk-badge.tsx`).

The Attorney Briefing Sheet turns "consult a lawyer" into something actionable rather than a dead-end disclaimer.

## Tech stack

- **Next.js 15** (App Router, TypeScript) — single repo for frontend + API routes
- **Google Gemini** (`@google/genai`) — the only GenAI dependency
- **Zod** — schema validation on every API boundary (request and LLM response)
- **Tailwind CSS** — styling, no component library dependency
- **pdf-parse** — pure-JS PDF text extraction, no native binaries
- **Vitest** — unit tests for the clause parser, PII sanitizer, highlight logic, and schemas
- **Netlify** — deployment (`@netlify/plugin-nextjs`), free tier

## Running locally

```bash
npm install
cp .env.example .env.local   # add your GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

```bash
npm run typecheck   # tsc --noEmit
npm run lint         # eslint
npm test             # vitest run
npm run build         # next build
```

## Project structure

```
app/
  page.tsx                 # upload screen -> results screen
  api/analyze/route.ts     # document analysis (GenAI call #1)
  api/chat-doc/route.ts    # grounded Q&A (GenAI call #2)
components/                # disclaimer modal/footer, upload, risk dashboard, Q&A chat, export button
lib/
  gemini.ts                # lazily-constructed server-only Gemini client
  prompts.ts                # system prompt + prompt builders
  schemas/legal-audit.ts    # Zod schema for the structured report
  clause-parser.ts, pii.ts, pdf.ts, highlight.ts, export-packet.ts
  __tests__/                # Vitest suite
public/samples/              # 3 sample documents for one-click demo
```
