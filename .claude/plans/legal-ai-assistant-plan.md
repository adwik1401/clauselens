# PromptWars Legal AI Assistant — Implementation Plan

**Overall Progress:** `83%`

## TLDR
Build "ClauseLens" — a GenAI-powered legal document assistant for the PromptWars: Virtual (Exclusive Edition) submission (theme: AI for Legal Assistance & Access). Users upload a contract/legal document and get: plain-language simplification, clause-level risk flagging (RED/AMBER/GREEN with verbatim quote anchors), a grounded Q&A chat over the document, and a one-click "Lawyer Escalation Pack" (summary + targeted questions) — turning the required legal disclaimer into a value-add feature rather than boilerplate. Single Next.js repo, Gemini 2.0 Flash structured outputs, deployed free on Vercel, kept well under the 10MB repo cap.

## Delegation Pipeline
Each code phase follows:
```
/execute (Codex) → /run-code → /fix-bug (if failures) → /review
```
- Before each `/execute`: TodoWrite entry + `[DELEGATING → Codex /execute]` announcement
- After each delegation: append a row to `.claude/agent-log.md` (create with table header on first use)
- No existing test suite → `/run-code` runs `npm run build` + `npm run typecheck` as the quality gate; once Vitest tests exist (Phase 5), `/run-code` runs `npm test` too

## Critical Decisions
- **Scope:** contract/legal-document risk analysis + plain-language + Q&A + lawyer escalation pack, covering use cases #1, #3, #4, #6, #7 from the problem statement in one coherent flow — not a generic "chat with PDF" wrapper.
- **No vector DB / RAG chunking:** Gemini's long-context window ingests the full document in one call; avoids repo bloat and chunking complexity inappropriate for a <10MB, 5-day solo build.
- **Single structured multi-task LLM call** (Zod schema, one `/api/analyze` request) instead of multiple sequential calls — lower latency, simpler code, cleaner "GenAI Architecture" mapping for submission requirement #4.
- **Stack:** Next.js 15 (App Router, TS) + `@google/genai` (Gemini 2.0 Flash) + Tailwind + shadcn/ui + `pdf-parse` + Zod. Single repo, deployed to Vercel free tier.
- **Disclaimers as UX, not boilerplate:** three-layer guardrail (entry modal → persistent footer → inline risk-card badges) plus the Lawyer Escalation Pack, satisfying the case study's "Legal Boundary" requirement while being demo-able in the video.
- **API key server-side only**, `.env.example` committed, `.env.local` gitignored — no secrets in repo.

## Tasks:

### Phase 1 — Project Scaffold & GenAI Integration Setup ✅
> `[DELEGATING → Codex /execute]` → `[DELEGATING → Codex /run-code]` → `[DELEGATING → Codex /review]`

- [x] 🟩 **Step 1: Initialize Next.js 15 project**
  - [x] 🟩 App Router, TypeScript, Tailwind CSS, ESLint (manually scaffolded — `create-next-app` rejected the folder name's capital letters)
  - [x] 🟩 Zod installed (shadcn/ui + Lucide deferred to Phase 3 when UI components need them, to avoid unused deps now)
  - [x] 🟩 `.gitignore` tuned for <10MB repo (excludes `.next/`, `node_modules/`, sample PDFs except small fixtures)
- [x] 🟩 **Step 2: Gemini SDK integration**
  - [x] 🟩 Installed `@google/genai`, wired `lib/gemini.ts` (server-side client, key from `process.env.GEMINI_API_KEY`)
  - [x] 🟩 `.env.example` with `GEMINI_API_KEY=`
- [x] 🟩 **Step 3: Upload UI shell**
  - [x] 🟩 Landing page (`app/page.tsx`) with drag/drop + file-picker upload and 3 instant sample documents (Freelancer MSA, Apartment Lease, SaaS NDA) as `.txt` fixtures under `public/samples/`
  - [x] 🟩 Entry disclaimer modal ("Legal Information, Not Legal Counsel") gating the page, `components/disclaimer-modal.tsx`

**Verification:** `npm run typecheck` passes; `npm run build` passes (Codex's sandboxed `run-code` check hit a `spawn EPERM` — confirmed as a Windows sandbox artifact, not a real failure, by re-running the build directly). Committed and pushed to `origin/main`.

### Phase 2 — Document Ingestion & Structured Analysis Engine ✅
> `[DELEGATING → Codex /execute]` → `[DELEGATING → Codex /run-code]` → `[DELEGATING → Codex /review]`

- [x] 🟩 **Step 4: PDF/text parsing**
  - [x] 🟩 `pdf-parse` server-side extraction (`lib/pdf.ts`) + clause-boundary regex tagging (`lib/clause-parser.ts`: `SECTION`, `ARTICLE`, `\d+\.\d+`, `(a)`-style sub-clauses)
  - [x] 🟩 PII sanitization pass (`lib/pii.ts`: emails, phone numbers, SSNs, card numbers) applied server-side before the LLM call
- [x] 🟩 **Step 5: Structured Zod schema**
  - [x] 🟩 `LegalAuditReportSchema` in `lib/schemas/legal-audit.ts` (contract type, risk score, executive summary, flagged clauses with exact quote anchors, rights/obligations, questions for lawyer, action checklist)
- [x] 🟩 **Step 6: `/api/analyze` route**
  - [x] 🟩 Single structured Gemini 2.0 Flash call (`app/api/analyze/route.ts`) with system prompt (closed-corpus grounding, zero-hallucination quote rule, adversarial risk checklist, prompt-injection guard treating document text as data not instructions)
  - [x] 🟩 Zod validation on request + response (response is JSON-parsed then `safeParse`d against the schema before ever reaching the client)

**Deviation from plan:** `lib/gemini.ts` originally threw eagerly if `GEMINI_API_KEY` was unset at module load — this broke `next build`, since Next imports route modules at build time to collect page data. Fixed by making the Gemini client lazily constructed (`getGemini()`), so the key is only required at request time, not build time.

### Phase 3 — Risk Dashboard UI & Disclaimer Layers ✅
> `[DELEGATING → Codex /execute]` → `[DELEGATING → Codex /run-code]` → `[DELEGATING → Codex /review]`

- [x] 🟩 **Step 7: Split-view results screen**
  - [x] 🟩 Left: `components/document-viewer.tsx` — document text with highlighted quote anchors (via `lib/highlight.ts`), clickable to jump to the matching risk card; Right: `components/risk-card.tsx` + `components/risk-badge.tsx` (CRITICAL/HIGH/MEDIUM/LOW badges, plain-English explanation, "why flagged", suggested next step)
  - [x] 🟩 Executive summary, rights/obligations lists, overall risk score in `components/risk-dashboard.tsx`
- [x] 🟩 **Step 8: Persistent + inline disclaimers**
  - [x] 🟩 Sticky footer notice (`components/disclaimer-footer.tsx`, layer 2)
  - [x] 🟩 Per-risk-card advisory via the risk badge (layer 3)

### Phase 4 — Document Q&A + Lawyer Escalation Pack ✅
> `[DELEGATING → Codex /execute]` → `[DELEGATING → Codex /run-code]` → `[DELEGATING → Codex /review]`

- [x] 🟩 **Step 9: Grounded Q&A chat**
  - [x] 🟩 `/api/chat-doc` route, answers constrained to document context, cites section numbers
  - [x] 🟩 Chat drawer UI (`components/qa-chat.tsx`) on results screen
- [x] 🟩 **Step 10: Lawyer Escalation Pack export**
  - [x] 🟩 `lib/export-packet.ts` builds the Markdown briefing sheet client-side from the already-returned analysis report (summary, flagged risks, questions, action checklist) — no separate API route or extra LLM call needed, since the data already exists after `/api/analyze`
  - [x] 🟩 One-click download button (`components/export-packet-button.tsx`)

**Deviation from plan:** Step 10 was planned as an `/api/export-packet` route; implemented as a client-side Markdown builder instead, since the report data is already on the client after analysis — avoids a redundant network round-trip and LLM call (better Efficiency score, simpler code for Code Quality).

### Phase 5 — Testing, Security & Accessibility Pass ✅
> `[DELEGATING → Codex /execute]` → `[DELEGATING → Codex /run-code]` → `[DELEGATING → Codex /review]`

- [x] 🟩 **Step 11: Unit tests (Vitest)**
  - [x] 🟩 23 tests across `lib/__tests__/`: clause parser (4), PII sanitizer (5), highlight ranges (5), Zod schemas (8), plus outline rendering — all passing
  - [x] 🟩 Tests caught two real bugs, fixed: (1) the numbered-clause heading regex required a trailing period ("4.1." but not "4.1 Indemnification"); (2) the phone-number PII regex left a stray leading "(" unmasked because a `\b` boundary can't match between two non-word characters
- [x] 🟩 **Step 12: Security hardening**
  - [x] 🟩 No secrets committed (`.env.local` gitignored, `.env.example` empty); Gemini client stays server-only, imported only from route handlers
  - [x] 🟩 Zod validation on both API routes' inputs and the analyze route's output
  - [x] 🟩 Prompt-injection guard in the system prompt (document text treated as data, not instructions)
  - [x] 🟩 Added upload size limits not in the original plan: 8MB file cap (`app/api/analyze/route.ts`) and a 500k-character cap on pasted text (`AnalyzeRequestSchema`), closing a DoS/cost-abuse gap found during this pass
- [x] 🟩 **Step 13: Accessibility pass**
  - [x] 🟩 Semantic HTML (`main`, `header`, `article`, `section[aria-label]`) already in place from Phase 3; added `aria-label` to the Q&A chat input, which previously relied on placeholder-only labeling

**Verification:** `npm run typecheck`, `npm run lint`, `npx vitest run` (23/23), and `npm run build` all pass clean.

### Phase 6 — Deploy, Submission Assets & Quality Gate
> Claude-managed (no sub-agent delegation)

- [ ] 🟥 Deploy to Vercel free tier, confirm live URL works end-to-end
- [ ] 🟥 Verify repo size < 10MB and is public
- [ ] 🟥 Write `README.md` with explicit GenAI Architecture section (services used + integration points) per submission requirement #4
- [ ] 🟥 Write project description (problem solved, concise) per submission requirement #3
- [ ] 🟥 Record demo video (<4 min, live data entry, GenAI output visibly highlighted) per Video Guide Requirements
- [ ] 🟥 Update `.claude/plans/legal-ai-assistant-plan.md` status to 100% and log entry in `CHANGELOG.md`
- [ ] 🟥 Final submission checklist: deployed prototype link, public GitHub repo link, description, GenAI architecture doc, demo video link — submit before Sept 26, 2026 deadline
