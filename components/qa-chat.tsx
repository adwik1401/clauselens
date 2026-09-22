"use client";

import { useState } from "react";
import { askQuestion } from "@/lib/api-client";

type ChatMessage = { role: "user" | "assistant"; text: string };

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// Grounded Q&A drawer: every question is answered against the loaded
// document only (see /api/chat-doc), never general knowledge.
export function QaChat({ documentText }: { documentText: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    setStreaming(false);
    setRetryStatus(null);

    let streamStarted = false;
    try {
      await askQuestion(
        documentText,
        q,
        (textSoFar) => {
          // First chunk: append the placeholder that later chunks update in
          // place, so the answer grows in the same bubble instead of one
          // new bubble per chunk.
          if (!streamStarted) {
            streamStarted = true;
            setStreaming(true);
            setMessages((prev) => [...prev, { role: "assistant", text: textSoFar }]);
          } else {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: "assistant", text: textSoFar };
              return next;
            });
          }
        },
        (attempt, max) => setRetryStatus(`Busy — retrying (${attempt}/${max})…`)
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${message}` }]);
    } finally {
      setLoading(false);
      setStreaming(false);
      setRetryStatus(null);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-16 right-4 z-30 flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-diffuse-lg transition-transform duration-150 active:scale-[0.98] dark:bg-white dark:text-stone-900"
      >
        <ChatIcon />
        Ask about this document
      </button>
    );
  }

  return (
    <div className="fixed bottom-16 right-4 z-30 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-diffuse-lg dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        <h2 className="font-heading text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Ask about this document
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          className="rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-50"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
            Answers are grounded in this document only — not general legal
            knowledge.
          </p>
        )}
        {messages.map((m, i) => (
          <p
            key={i}
            className={`rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
              m.role === "user"
                ? "ml-auto max-w-[85%] bg-accent text-accent-foreground"
                : "mr-auto max-w-[85%] bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-100"
            }`}
          >
            {m.text}
          </p>
        ))}
        {loading && !streaming && (
          <p className="mr-auto text-xs text-stone-500 dark:text-stone-400">
            {retryStatus ?? "Thinking…"}
          </p>
        )}
      </div>

      <form onSubmit={handleAsk} className="flex gap-2 border-t border-stone-200 p-2.5 dark:border-stone-800">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Can I sublet the apartment?"
          aria-label="Ask a question about this document"
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
