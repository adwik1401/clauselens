import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClauseLens — Understand Any Legal Document",
  description:
    "AI-powered legal document assistant: plain-language simplification, clause risk flagging, and lawyer-ready briefing packs. Informational only — not a substitute for professional legal advice.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
