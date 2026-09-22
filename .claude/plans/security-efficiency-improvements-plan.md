# Security & Efficiency Score Improvements Plan

**Overall Progress:** `100%`

## TLDR
The submission's AI Evaluation Score is 97.75/100, with Code Quality, Testing, Accessibility, and Problem Statement Alignment already at 100. The two categories with headroom are Security (95) and Efficiency (90). This plan closes concrete, identifiable gaps in both without touching the categories already maxed out.

## Delegation Pipeline
Each phase follows:
```
/execute (Codex) → /run-code → /fix-bug (if failures) → /review
```
- Before each `/execute`: TodoWrite entry + `[DELEGATING → Codex /execute]` announcement
- After each delegation: append to `.claude/agent-log.md`
- `/run-code` runs `npm run typecheck && npm run lint && npm test && npm run build` as the quality gate (existing test suite)

## Critical Decisions
- **Scope limited to the gaps already diagnosed** — security headers, basic rate limiting, file-content validation, dependency audit fixes (Security); response streaming and a document-hash cache (Efficiency). No new features, no unrelated refactors.
- **Rate limiting: in-memory, not a new external dependency** — the app is a single Netlify Function per route with no existing Redis/Upstash infra; a lightweight in-memory token bucket keyed by IP is sufficient for abuse protection and avoids adding paid infrastructure or a new npm dependency for a hackathon submission.
- **Cache: in-memory, keyed by a hash of the sanitized document text** — same rationale; avoids re-calling Gemini for an identical document within a function instance's lifetime, no new infra.
- **Streaming: only on `/api/analyze` and `/api/chat-doc`** — these are the two Gemini call sites; no other route needs it.
- **npm audit fixes: only non-breaking ones** — transitive vulnerabilities that require a major version bump (e.g. Next.js 16) are out of scope; flagged instead of force-upgraded.

## Tasks:

### Phase 1 — Security Hardening ✅
> `[DELEGATING → Codex /execute]` → `[DELEGATING → Codex /run-code]` → `[DELEGATING → Codex /review]`

- [x] 🟩 **Step 1: Security response headers**
  - [x] 🟩 Added `headers()` in `next.config.ts`: CSP (scoped to same-origin only — no external scripts/styles/fonts/images needed), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
- [x] 🟩 **Step 2: Rate limiting on API routes**
  - [x] 🟩 `lib/rate-limit.ts` — in-memory fixed-window limiter (10 req/min per IP), applied to both `/api/analyze` and `/api/chat-doc`
  - [x] 🟩 Returns `429` with `Retry-After` header when exceeded — verified live: 11th/12th rapid request both got `429`
- [x] 🟩 **Step 3: File-content validation on upload**
  - [x] 🟩 `lib/file-validation.ts` — checks the actual `%PDF-` magic bytes before passing to `pdf-parse`, not just the filename/MIME type — verified live: a `.txt` file renamed to `.pdf` is correctly rejected with 400
- [x] 🟩 **Step 4: Dependency audit**
  - [x] 🟩 Added a `uuid` override (`^11.1.1`) in `package.json` to fix the moderate transitive vulnerability via `@google/genai → google-auth-library → gaxios → uuid`; verified build/tests still pass
  - [x] 🟩 `postcss` vulnerability (bundled inside `next`'s own internals) documented as out of scope — the only fix is `next@16`, a major bump with real breaking-change risk right before a submission deadline

**Verification:** all 4 changes tested live against the dev server (see above), not just unit-tested.

### Phase 2 — Efficiency Improvements ✅
> `[DELEGATING → Codex /execute]` → `[DELEGATING → Codex /run-code]` → `[DELEGATING → Codex /review]`

- [x] 🟩 **Step 5/6 — Stream the chat-doc response (scope narrowed from the original plan)**
  - [x] 🟩 `/api/chat-doc` now uses `generateContentStream` and returns a chunked `text/plain` stream; `lib/api-client.ts`'s `askQuestion` and `components/qa-chat.tsx` consume it progressively, updating the same message bubble as tokens arrive
  - **Deviation:** the plan originally called for streaming `/api/analyze` too. Skipped that: the analyze endpoint must return complete, Zod-validated JSON before it's usable at all (structured output can't be progressively parsed mid-stream without real risk of validating malformed partial JSON), so literal HTTP streaming there would add complexity without a real efficiency or UX win. `/api/chat-doc` is free-form prose and streams cleanly — that's where the plan's actual goal (reduced perceived latency, progressive rendering) applies.
- [x] 🟩 **Step 7: Document-hash cache**
  - [x] 🟩 `lib/cache.ts` — SHA-256 hash of the sanitized document text, 10-minute TTL, in-memory per function instance
  - [x] 🟩 Wired into `/api/analyze`: a cache hit skips the Gemini call entirely — verified live: first call 7.96s, second identical call 0.017s (~470x faster), responses byte-identical

**Verification:** streaming confirmed via `Transfer-Encoding: chunked` header and progressive chunk delivery; cache confirmed via the timing test above.

### Phase 3 — Verify & Deploy ✅
> Claude-managed (no sub-agent delegation)

- [x] 🟩 Full local verification: `npm run typecheck && npm run lint && npm test && npm run build` — all pass (51/51 tests, including 14 new tests across `rate-limit.test.ts`, `file-validation.test.ts`, `cache.test.ts`, and updated `api-client.test.ts` streaming mocks)
- [x] 🟩 Local smoke test: rate limit triggers correctly (429 on 11th request), streaming confirmed chunked, cache hit confirmed (~470x speedup), security headers present on every response including the streamed one
- [x] 🟩 Commit, push, redeploy to Netlify
- [x] 🟩 Live smoke test against the deployed site
- [x] 🟩 Update `CHANGELOG.md`
