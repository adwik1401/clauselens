# PromptWars Legal AI Assistant — Implementation Plan

**Overall Progress:** `17%`

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

### Phase 2 — Document Ingestion & Structured Analysis Engine
> `[DELEGATING → Codex /execute]` → `[DELEGATING → Codex /run-code]` → `[DELEGATING → Codex /review]`

- [ ] 🟥 **Step 4: PDF/text parsing**
  - [ ] 🟥 `pdf-parse` server-side extraction + clause-boundary regex tagging (`SECTION`, `ARTICLE`, `\d+\.\d+`)
  - [ ] 🟥 Basic client-side PII sanitization pass before sending to LLM
- [ ] 🟥 **Step 5: Structured Zod schema**
  - [ ] 🟥 `LegalAuditReportSchema` (contract type, risk score, executive summary, flagged clauses with exact quote anchors, rights/obligations, questions for lawyer, action checklist)
- [ ] 🟥 **Step 6: `/api/analyze` route**
  - [ ] 🟥 Single structured Gemini 2.0 Flash call with system prompt (closed-corpus grounding, zero-hallucination quote rule, adversarial risk checklist)
  - [ ] 🟥 Zod validation on request + response

### Phase 3 — Risk Dashboard UI & Disclaimer Layers
> `[DELEGATING → Codex /execute]` → `[DELEGATING → Codex /run-code]` → `[DELEGATING → Codex /review]`

- [ ] 🟥 **Step 7: Split-view results screen**
  - [ ] 🟥 Left: document text with highlighted quote anchors; Right: risk cards (RED/AMBER/GREEN badges, plain-English explanation, "gotcha")
  - [ ] 🟥 Executive summary, rights/obligations lists, overall risk score
- [ ] 🟥 **Step 8: Persistent + inline disclaimers**
  - [ ] 🟥 Sticky footer notice
  - [ ] 🟥 Per-risk-card advisory badge

### Phase 4 — Document Q&A + Lawyer Escalation Pack
> `[DELEGATING → Codex /execute]` → `[DELEGATING → Codex /run-code]` → `[DELEGATING → Codex /review]`

- [ ] 🟥 **Step 9: Grounded Q&A chat**
  - [ ] 🟥 `/api/chat-doc` route, answers constrained to document context, cites section numbers
  - [ ] 🟥 Chat drawer UI on results screen
- [ ] 🟥 **Step 10: Lawyer Escalation Pack export**
  - [ ] 🟥 `/api/export-packet` generates Markdown/PDF: summary, flagged risks, 5-7 targeted attorney questions
  - [ ] 🟥 One-click download button on results screen

### Phase 5 — Testing, Security & Accessibility Pass
> `[DELEGATING → Codex /execute]` → `[DELEGATING → Codex /run-code]` → `[DELEGATING → Codex /review]`

- [ ] 🟥 **Step 11: Unit tests (Vitest)**
  - [ ] 🟥 Clause parser tests, schema validation tests, PII sanitizer tests
- [ ] 🟥 **Step 12: Security hardening**
  - [ ] 🟥 Confirm no secrets committed, server-only key usage, input validation on all API routes, basic prompt-injection guard in system prompt
- [ ] 🟥 **Step 13: Accessibility pass**
  - [ ] 🟥 Semantic HTML (`main`, `nav`, `article`), ARIA on risk badges, WCAG AA contrast check

### Phase 6 — Deploy, Submission Assets & Quality Gate
> Claude-managed (no sub-agent delegation)

- [ ] 🟥 Deploy to Vercel free tier, confirm live URL works end-to-end
- [ ] 🟥 Verify repo size < 10MB and is public
- [ ] 🟥 Write `README.md` with explicit GenAI Architecture section (services used + integration points) per submission requirement #4
- [ ] 🟥 Write project description (problem solved, concise) per submission requirement #3
- [ ] 🟥 Record demo video (<4 min, live data entry, GenAI output visibly highlighted) per Video Guide Requirements
- [ ] 🟥 Update `.claude/plans/legal-ai-assistant-plan.md` status to 100% and log entry in `CHANGELOG.md`
- [ ] 🟥 Final submission checklist: deployed prototype link, public GitHub repo link, description, GenAI architecture doc, demo video link — submit before Sept 26, 2026 deadline
