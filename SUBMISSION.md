# PromptWars: Virtual (Exclusive Edition) — Submission

## Project Description

**ClauseLens** helps people understand legal documents — leases, NDAs, freelance contracts — before they sign them. Upload a document and get a plain-language risk breakdown: an overall risk score, your rights vs. your obligations, and every risky clause flagged with its exact source quote, a plain-English explanation, why it's a problem, and a suggested negotiation point. A grounded Q&A chat lets you ask follow-up questions answered strictly from the document you uploaded, and a one-click "Attorney Briefing Sheet" turns the standard "consult a lawyer" disclaimer into something you can actually bring to a 30-minute consultation.

It targets the case study's theme directly: simplifying complex legal documents, highlighting risky clauses, answering questions over legal documents, and helping users prepare for a professional consultation — all in one coherent flow, not five disconnected features.

## Submission Components

| Requirement | Link / Location |
|---|---|
| Deployed Prototype | https://clauselens-793.netlify.app |
| GitHub Repository (public, <10MB) | https://github.com/adwik1401/clauselens (~245KB pushed) |
| Project Description | See above, and `README.md` |
| GenAI Architecture | `README.md#genai-architecture` — explicit service, files, and data flow |
| Demo Video (<4 min) | **TODO — not recorded yet, see below** |

## Demo Video — Not Yet Recorded

This requires you, not me: a screen recording with live data entry (the guidelines explicitly forbid pre-filled forms), under 4 minutes. I can't record your screen or narrate a video in this environment.

**Before recording:** have a real lease/contract file ready on your desktop (a `.txt` works — you can literally use `public/samples/apartment-lease.txt` renamed, or any other real-looking lease text saved locally). Open https://clauselens-793.netlify.app in a fresh tab (no cache) so the disclaimer modal is genuinely unacknowledged on camera. Close other tabs/notifications. Test your mic levels once before the real take.

### Script (target 3:30, hard ceiling 4:00)

| Time | Screen action (do this live, on camera) | Say (or caption) |
|---|---|---|
| 0:00–0:12 | Land on the ClauseLens homepage, disclaimer modal already up. | "Most people never read the lease they sign. ClauseLens does — and tells you what's hiding in it." |
| 0:12–0:22 | Tick the checkbox, click "Continue to analyze document" **live**. | "Quick note: this is informational, not legal advice — that's built into the product, not just this video." |
| 0:22–0:45 | **Live drag-and-drop**: drag your real lease `.txt`/`.pdf` file from the desktop straight onto the dropzone. Do not pre-select it — the drag itself must happen on screen. | "I'm dropping in a real lease — nothing pre-loaded, nothing typed in advance." |
| 0:45–1:05 | Show the "Analyzing…" loading state for its real duration (don't cut it) — this is the live Gemini API call. | "This is a live call to Gemini right now — full document in one pass, no canned response." |
| 1:05–1:45 | Results screen loads. Point out: the risk score meter/number, the executive summary, 1–2 flagged clause cards with their **verbatim quotes**. | "94 out of 100. And every flag quotes the exact sentence — not a summary, the actual clause." |
| 1:45–2:00 | Click a highlighted quote in the left document panel; show it jump-scroll to its matching risk card on the right. | "Click a highlight, jump straight to why it's flagged." |
| 2:00–2:40 | Open the Q&A chat drawer. **Type a real question live**, character by character (e.g. "Can I sublet this apartment?"), hit send, show the real streamed answer land, citing a section number. | "Now I ask it something myself — this answer is grounded only in the document I just uploaded, live." |
| 2:40–3:05 | Click "Download attorney briefing." Show the file actually download, then open the `.md` file and scroll it briefly. | "One click turns this into a briefing sheet you'd actually bring to a lawyer." |
| 3:05–3:25 | Scroll to show the persistent disclaimer footer once more; optionally flash the GitHub repo URL or README GenAI-architecture section. | "Legal information, not legal advice — every screen says so. Repo and live link are below." |
| 3:25–3:30 | End on the results screen or wordmark. | (silence / fade) |

### Guideline compliance checklist (from the official requirements)

- [ ] **Live data entry, not pre-filled** — the file drag (0:22) and the chat question (2:00) are the two moments this must be genuinely live, not simulated
- [ ] **Core walkthrough** — upload → analysis → risk dashboard → Q&A → export, all shown
- [ ] **GenAI visibly highlighted** — call out on camera/in captions that the analysis (1:05) and the Q&A answer (2:00) are live Gemini calls, not canned
- [ ] **Clear, easy steps** — one action per beat, no jump cuts skipping a click
- [ ] **Under 4 minutes** — script totals 3:30, leaving ~30s margin for natural pacing
- [ ] **Good audio/video quality** — test mic and screen resolution before the real take

Full official guidelines: https://docs.google.com/document/d/e/2PACX-1vROmkFEAtFJ5k7PIl4H-B5AFDf2-vv6wLPRsuKnDSprJO30kvB7p-oarZdNZQhsF5srNQ0KAKCP6RBm/pub

## Final Checklist Before Submitting

- [x] Deployed prototype is live and was smoke-tested end-to-end (both `/api/analyze` and `/api/chat-doc` verified against the real deployment)
- [x] GitHub repo is public and well under the 10MB cap
- [x] GenAI architecture explicitly documented
- [x] Project description written
- [ ] Demo video recorded and uploaded (**blocking — your action**)
- [ ] Submit before the deadline: **Sept 26, 2026**
