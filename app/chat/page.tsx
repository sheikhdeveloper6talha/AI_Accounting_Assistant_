"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "Assalam-o-Alaikum! Entry likhein, kisi mahine ka report puchein, ya audit chalayein — e.g. 'Add office rent 50000 for July' ya 'is mahine ka P&L dikhao'." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextHistory = [...messages, { role: "user" as const, text: trimmed }];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const data = await api.chat(trimmed, messages);
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Maaf kijiye, abhi jawab nahi de saka. Backend/API key check karein." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold">AI Assistant</h2>
        <p className="text-sm text-[#1F2A37]/60">Add entries, ask for totals, or generate reports in plain language.</p>
      </div>

      <div className="rounded-xl border border-[#1F2A37]/10 bg-white shadow-sm">
        <div className="flex h-96 flex-col gap-3 overflow-y-auto px-5 py-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                m.role === "user" ? "bg-[#1F2A37] text-[#F7F5F0]" : "bg-[#C08A2E]/10 text-[#1F2A37] border border-[#C08A2E]/30"
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-[#C08A2E]/30 bg-[#C08A2E]/10 px-4 py-2 text-sm text-[#1F2A37]/60">Soch raha hoon...</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 border-t border-[#1F2A37]/10 p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='e.g. "How much did we spend on utilities in March?"'
            className="flex-1 rounded-lg border border-[#1F2A37]/15 bg-[#F7F5F0] px-3 py-2 text-sm outline-none focus:border-[#C08A2E] focus:ring-1 focus:ring-[#C08A2E]"
          />
          <button type="submit" disabled={loading || !input.trim()} className="rounded-lg bg-[#C08A2E] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#a8781f] disabled:opacity-40">
            Send
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-[#1F2A37]/10 bg-white p-4 text-xs text-[#1F2A37]/60">
        Try: "Add office rent 50000 for July" · "July me bijli ka bill kitna tha" · "P&L for July dikhao" · "Is month ka audit chalao"
      </div>
    </div>
  );
}
