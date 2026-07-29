"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { EntryType, MONTHS, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/types";

export default function AddEntryPage() {
  const [type, setType] = useState<EntryType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function switchType(next: EntryType) {
    setType(next);
    setCategory(next === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setStatus({ ok: false, text: "Enter a valid amount." });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      await api.createEntry({ type, amount: Number(amount), category, month, date, note });
      setStatus({ ok: true, text: `${type === "expense" ? "Expense" : "Income"} added.` });
      setAmount("");
      setNote("");
    } catch (err: any) {
      setStatus({ ok: false, text: err.message || "Could not save entry." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold">Add Entry</h2>
        <p className="text-sm text-[#1F2A37]/60">Log a new income or expense record.</p>
      </div>

      <div className="rounded-xl border border-[#1F2A37]/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex gap-2">
          {(["expense", "income"] as EntryType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchType(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition ${
                type === t ? "bg-[#1F2A37] text-white" : "bg-[#1F2A37]/5 text-[#1F2A37]/60 hover:bg-[#1F2A37]/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Amount">
            <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000" className="w-full rounded-lg border border-[#1F2A37]/15 px-3 py-2 text-sm font-mono outline-none focus:border-[#C08A2E] focus:ring-1 focus:ring-[#C08A2E]" />
          </Field>

          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-[#1F2A37]/15 px-3 py-2 text-sm outline-none focus:border-[#C08A2E] focus:ring-1 focus:ring-[#C08A2E]">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Month">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full rounded-lg border border-[#1F2A37]/15 px-3 py-2 text-sm outline-none focus:border-[#C08A2E] focus:ring-1 focus:ring-[#C08A2E]">
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>

          <Field label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-[#1F2A37]/15 px-3 py-2 text-sm outline-none focus:border-[#C08A2E] focus:ring-1 focus:ring-[#C08A2E]" />
          </Field>

          <Field label="Note (optional)">
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. WAPDA bill" className="w-full rounded-lg border border-[#1F2A37]/15 px-3 py-2 text-sm outline-none focus:border-[#C08A2E] focus:ring-1 focus:ring-[#C08A2E]" />
          </Field>

          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#C08A2E] py-2.5 text-sm font-medium text-white transition hover:bg-[#a8781f] disabled:opacity-40">
            {submitting ? "Adding..." : `Add ${type === "expense" ? "Expense" : "Income"}`}
          </button>

          {status && <p className={`text-xs ${status.ok ? "text-green-700" : "text-red-600"}`}>{status.text}</p>}
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#1F2A37]/50">{label}</span>
      {children}
    </label>
  );
}
