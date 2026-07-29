"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Transaction, MONTHS } from "@/lib/types";

interface Filters {
  type: string;
  category: string;
  month: string;
  startDate: string;
  endDate: string;
}

export default function LedgerPage() {
  const [entries, setEntries] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState({ totalIncome: 0, totalExpenses: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ type: "", category: "", month: "", startDate: "", endDate: "" });

  const query = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && p.set(k, v));
    return p.toString();
  }, [filters]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.listEntries(query);
      setEntries(data.entries || []);
      setTotals({ totalIncome: data.totalIncome, totalExpenses: data.totalExpenses, net: data.net });
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    await api.deleteEntry(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold">Ledger</h2>
        <p className="text-sm text-[#1F2A37]/60">All income and expense records, filterable by type, category, month, or date range.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))} className="rounded-lg border border-[#1F2A37]/15 bg-white px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filters.month} onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))} className="rounded-lg border border-[#1F2A37]/15 bg-white px-3 py-2 text-sm">
          <option value="">All Months</option>
          {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input placeholder="category" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} className="rounded-lg border border-[#1F2A37]/15 bg-white px-3 py-2 text-sm" />
        <input type="date" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} className="rounded-lg border border-[#1F2A37]/15 bg-white px-3 py-2 text-sm" aria-label="Start date" />
        <input type="date" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} className="rounded-lg border border-[#1F2A37]/15 bg-white px-3 py-2 text-sm" aria-label="End date" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1F2A37]/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1F2A37]/5 text-xs uppercase tracking-wide text-[#1F2A37]/60">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Month</th>
              <th className="px-4 py-2">Note</th>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2A37]/5">
            {loading && <tr><td colSpan={8} className="px-4 py-6 text-center text-[#1F2A37]/50">Loading...</td></tr>}
            {!loading && entries.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-[#1F2A37]/50">No entries found.</td></tr>}
            {!loading && entries.map((e) => (
              <tr key={e._id}>
                <td className="px-4 py-2 whitespace-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${e.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{e.type}</span>
                </td>
                <td className="px-4 py-2 capitalize">{e.category}</td>
                <td className="px-4 py-2">{e.month}</td>
                <td className="px-4 py-2 text-[#1F2A37]/60">{e.note || "—"}</td>
                <td className="px-4 py-2 text-[#1F2A37]/40 text-xs uppercase">{e.source}</td>
                <td className="px-4 py-2 text-right font-mono">{e.amount.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleDelete(e._id)} className="text-xs text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Income" value={totals.totalIncome} tone="text-green-700" />
        <SummaryCard label="Expenses" value={totals.totalExpenses} tone="text-red-700" />
        <SummaryCard label="Net" value={totals.net} tone="text-[#1F2A37]" dark />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone, dark }: { label: string; value: number; tone: string; dark?: boolean }) {
  return (
    <div className={`rounded-xl border border-[#1F2A37]/10 p-4 shadow-sm ${dark ? "bg-[#1F2A37] text-[#F7F5F0]" : "bg-white"}`}>
      <p className={`text-xs uppercase tracking-wide ${dark ? "text-[#F7F5F0]/60" : "text-[#1F2A37]/50"}`}>{label}</p>
      <p className={`mt-1 font-mono text-xl font-semibold ${dark ? "text-[#F7F5F0]" : tone}`}>Rs {value.toLocaleString()}</p>
    </div>
  );
}
