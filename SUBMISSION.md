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

Suggested walkthrough, timed to fit the 4-minute limit:

1. **(0:00-0:30)** Show the disclaimer modal, acknowledge it, and explain the problem in one sentence.
2. **(0:30-1:30)** Upload a real document live (type/paste text, or use a sample button) — show the analysis loading, then the resulting risk dashboard: risk score, flagged clauses, quote highlighting.
3. **(1:30-2:30)** Click a highlighted quote to jump to its risk card; explain one flagged clause out loud (this is where GenAI output should be visibly on screen).
4. **(2:30-3:15)** Ask a live question in the Q&A chat drawer; show the grounded answer coming back.
5. **(3:15-3:45)** Click "Download Attorney Briefing" and show the generated Markdown file.
6. **(3:45-4:00)** Close on the persistent disclaimer footer and the repo/live links.

Full official guidelines: https://docs.google.com/document/d/e/2PACX-1vROmkFEAtFJ5k7PIl4H-B5AFDf2-vv6wLPRsuKnDSprJO30kvB7p-oarZdNZQhsF5srNQ0KAKCP6RBm/pub

## Final Checklist Before Submitting

- [x] Deployed prototype is live and was smoke-tested end-to-end (both `/api/analyze` and `/api/chat-doc` verified against the real deployment)
- [x] GitHub repo is public and well under the 10MB cap
- [x] GenAI architecture explicitly documented
- [x] Project description written
- [ ] Demo video recorded and uploaded (**blocking — your action**)
- [ ] Submit before the deadline: **Sept 26, 2026**
