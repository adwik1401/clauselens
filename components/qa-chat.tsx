"use client";

import { useState } from "react";

type ChatMessage = { role: "user" | "assistant"; text: string };

// Grounded Q&A drawer: every question is answered against the loaded
// document only (see /api/chat-doc), never general knowledge.
export function QaChat({ documentText }: { documentText: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText, question: q }),
      });
      const data = await res.json();
      const answer = res.ok ? data.answer : `Error: ${data.error ?? "Something went wrong."}`;
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Network error — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-14 right-4 z-30 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-neutral-900"
      >
        Ask about this document
      </button>
    );
  }

  return (
    <div className="fixed bottom-14 right-4 z-30 flex h-96 w-80 flex-col rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          Ask about this document
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-50"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {messages.length === 0 && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Answers are grounded in this document only — not general legal
            knowledge.
          </p>
        )}
        {messages.map((m, i) => (
          <p
            key={i}
            className={`rounded-lg px-2.5 py-1.5 text-sm ${
              m.role === "user"
                ? "ml-auto max-w-[85%] bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "mr-auto max-w-[85%] bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
            }`}
          >
            {m.text}
          </p>
        ))}
        {loading && (
          <p className="mr-auto text-xs text-neutral-500 dark:text-neutral-400">Thinking…</p>
        )}
      </div>

      <form onSubmit={handleAsk} className="flex gap-2 border-t border-neutral-200 p-2 dark:border-neutral-800">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Can I sublet the apartment?"
          aria-label="Ask a question about this document"
          className="flex-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
