import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Accounting Assistant",
  description: "AI-powered bookkeeping prototype",
};

const NAV = [
  { href: "/", label: "Ledger" },
  { href: "/add", label: "Add Entry" },
  { href: "/chat", label: "AI Assistant" },
  { href: "/reports", label: "Reports" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F5F0] text-[#1F2A37]">
        <header className="border-b border-[#1F2A37]/10 bg-[#1F2A37] text-[#F7F5F0]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#C08A2E]">Prototype</p>
              <h1 className="font-serif text-xl font-semibold sm:text-2xl">AI Accounting Assistant</h1>
            </div>
            <nav className="flex flex-wrap gap-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-[#F7F5F0]/80 transition hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-8">{children}</div>
      </body>
    </html>
  );
}
