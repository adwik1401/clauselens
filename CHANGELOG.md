# Changelog

All notable changes to ClauseLens, logged per `/execute` phase.

## Security & Efficiency Score Improvements
Targeted the two AI-evaluator categories with headroom (Security 95, Efficiency 90 — four others already at 100).

- **Security:** added CSP + security response headers (`next.config.ts`); in-memory per-IP rate limiting (10 req/min) on both API routes, returning `429`; file-content validation on upload (checks actual `%PDF-` magic bytes, not just filename/MIME type); fixed the `uuid` transitive vulnerability via a `package.json` override. The `postcss` vulnerability bundled inside Next.js's own internals is documented as out of scope — its only fix is a `next@16` major bump.
- **Efficiency:** `/api/chat-doc` now streams the Gemini response (`generateContentStream`) instead of buffering the full answer before replying — the Q&A chat renders progressively, chunk by chunk. `/api/analyze` gained a SHA-256 document-hash cache (10-minute TTL) that skips the Gemini call entirely on a repeat document — verified live at ~470x faster on a cache hit (7.96s → 0.017s).
- **Deviation:** the plan originally called for streaming `/api/analyze` as well. Skipped — that endpoint must return complete, Zod-validated JSON before it's usable, so literal HTTP streaming there would add complexity without a real win. Streaming applies where it actually helps: free-form Q&A prose.
- 14 new tests (`rate-limit.test.ts`, `file-validation.test.ts`, `cache.test.ts`, plus updated streaming mocks in `api-client.test.ts`), all verified live against the dev server, not just unit-tested.

## Phase 6 — Deploy & Submission Assets
- Fixed `GEMINI_MODEL` from the retired `gemini-2.0-flash` to `gemini-3.6-flash` (found via a live 404 from the Gemini API during end-to-end testing).
- Deployed to Netlify (`https://clauselens-793.netlify.app`) under a personal account, with `GEMINI_API_KEY` set as a Netlify env var.
- Verified live: `/api/analyze` and `/api/chat-doc` both tested against the deployed serverless functions with real sample documents.
- Added `README.md` (GenAI architecture mapping, legal-boundary summary, stack, local dev instructions) and this changelog.

## Phase 5 — Testing, Security & Accessibility
- Added 23 Vitest unit tests (clause parser, PII sanitizer, highlight ranges, Zod schemas). Tests caught and led to fixes for two real bugs: a numbered-clause heading regex requiring a trailing period, and a phone-number PII regex leaving a stray `(` unmasked.
- Added an 8MB file-size cap and a 500k-character text cap to `/api/analyze` to close a DoS/cost-abuse gap.
- Added `aria-label` to the Q&A chat input (previously placeholder-only).

## Phases 2-4 — Analysis Engine, Risk Dashboard, Q&A, Escalation Pack
- Built the structured document-analysis pipeline: PDF extraction, PII masking, clause-boundary parsing, a Zod-validated `LegalAuditReportSchema`, and a single structured Gemini call (`/api/analyze`).
- Built the split-view risk dashboard: highlighted document text linked to risk cards, executive summary, rights/obligations, overall risk score.
- Added the persistent disclaimer footer (guardrail layer 2) alongside the Phase 1 entry modal (layer 1) and per-card badges (layer 3).
- Added grounded document Q&A (`/api/chat-doc`) and a client-side-generated Attorney Briefing Sheet (Markdown export) — the latter deviates from the original plan (no separate export API route / no extra LLM call) for efficiency.
- Fixed a build-breaking bug: `lib/gemini.ts` threw at module import time when `GEMINI_API_KEY` was unset, breaking `next build` (Next imports route modules at build time). Fixed by lazily constructing the client on first request.
- Briefly explored switching to OpenRouter (reusing a key from a prior PromptWars submission) at the user's request; reverted after the key turned out to be expired and the user chose to stay on Gemini with a fresh key.

## Phase 1 — Project Scaffold & GenAI Integration Setup
- Manually scaffolded Next.js 15 (App Router, TypeScript, Tailwind, ESLint flat config) — `create-next-app` rejected the project folder's capital letters.
- Wired `lib/gemini.ts` (server-only `@google/genai` client) and the upload UI shell with the entry disclaimer modal and three sample documents.
- Initialized the git repo and pushed to a new public GitHub repo (`github.com/adwik1401/clauselens`).
