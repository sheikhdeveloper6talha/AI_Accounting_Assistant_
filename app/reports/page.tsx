"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AuditReport, BalanceSheet, MONTHS, PLReport } from "@/lib/types";

type Tab = "pl" | "balance" | "audit";

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("pl");
  const [month, setMonth] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold">Reports</h2>
        <p className="text-sm text-[#1F2A37]/60">Generated live from stored entries — nothing here is hard-coded.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {([["pl", "P&L"], ["balance", "Balance Sheet"], ["audit", "Audit"]] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === key ? "bg-[#1F2A37] text-white" : "bg-white text-[#1F2A37]/60 border border-[#1F2A37]/10 hover:bg-[#1F2A37]/5"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab !== "balance" && (
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-[#1F2A37]/15 bg-white px-3 py-2 text-sm">
            <option value="">All time</option>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
      </div>

      {tab === "pl" && <PLView month={month} />}
      {tab === "balance" && <BalanceView />}
      {tab === "audit" && <AuditView month={month} />}
    </div>
  );
}

function PLView({ month }: { month: string }) {
  const [report, setReport] = useState<PLReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.pl(month || undefined).then(setReport).finally(() => setLoading(false));
  }, [month]);

  if (loading) return <Loading />;
  if (!report) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Total Income" value={report.totalIncome} tone="text-green-700" />
        <Stat label="Total Expenses" value={report.totalExpenses} tone="text-red-700" />
        <Stat label="Net Profit" value={report.netProfit} tone={report.netProfit >= 0 ? "text-green-700" : "text-red-700"} dark />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CategoryTable title="Income by Category" rows={report.incomeByCategory} />
        <CategoryTable title="Expenses by Category" rows={report.expensesByCategory} />
      </div>
    </div>
  );
}

function BalanceView() {
  const [sheet, setSheet] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.balanceSheet().then(setSheet).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!sheet) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Total Income (all time)" value={sheet.totalIncome} tone="text-green-700" />
        <Stat label="Total Expenses (all time)" value={sheet.totalExpenses} tone="text-red-700" />
        <Stat label="Net Cash Position" value={sheet.netCashPosition} tone={sheet.netCashPosition >= 0 ? "text-green-700" : "text-red-700"} dark />
      </div>
      <p className="text-xs text-[#1F2A37]/50">{sheet.note} As of {sheet.asOf}.</p>
    </div>
  );
}

function AuditView({ month }: { month: string }) {
  const [audit, setAudit] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.audit(month || undefined).then(setAudit).finally(() => setLoading(false));
  }, [month]);

  if (loading) return <Loading />;
  if (!audit) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat label="Entries Reviewed" value={audit.entriesReviewed} tone="text-[#1F2A37]" plain />
        <Stat label="Flagged" value={audit.flaggedCount} tone="text-red-700" plain />
      </div>

      <div className="rounded-xl border border-[#1F2A37]/10 bg-white shadow-sm">
        <div className="border-b border-[#1F2A37]/10 px-5 py-3">
          <h3 className="font-serif text-lg font-semibold">Flagged Entries</h3>
        </div>
        {audit.flags.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[#1F2A37]/50">Nothing flagged for this period.</p>
        ) : (
          <ul className="divide-y divide-[#1F2A37]/5">
            {audit.flags.map((f) => (
              <li key={f.id + f.reason} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="capitalize">{f.entry.category} — Rs {f.entry.amount.toLocaleString()}</p>
                  <p className="text-xs text-[#1F2A37]/50">{f.reason}</p>
                </div>
                <span className="text-xs text-[#1F2A37]/40">{new Date(f.entry.date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CategoryTable({ title, rows }: { title: string; rows: { category: string; amount: number }[] }) {
  return (
    <div className="rounded-xl border border-[#1F2A37]/10 bg-white shadow-sm">
      <div className="border-b border-[#1F2A37]/10 px-5 py-3">
        <h3 className="font-serif text-base font-semibold">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-4 text-sm text-[#1F2A37]/50">No data.</p>
      ) : (
        <ul className="divide-y divide-[#1F2A37]/5">
          {rows.map((r) => (
            <li key={r.category} className="flex items-center justify-between px-5 py-2 text-sm">
              <span className="capitalize">{r.category}</span>
              <span className="font-mono">{r.amount.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, tone, dark, plain }: { label: string; value: number; tone: string; dark?: boolean; plain?: boolean }) {
  return (
    <div className={`rounded-xl border border-[#1F2A37]/10 p-4 shadow-sm ${dark ? "bg-[#1F2A37]" : "bg-white"}`}>
      <p className={`text-xs uppercase tracking-wide ${dark ? "text-[#F7F5F0]/60" : "text-[#1F2A37]/50"}`}>{label}</p>
      <p className={`mt-1 font-mono text-xl font-semibold ${dark ? "text-[#F7F5F0]" : tone}`}>{plain ? value : `Rs ${value.toLocaleString()}`}</p>
    </div>
  );
}

function Loading() {
  return <div className="rounded-xl border border-[#1F2A37]/10 bg-white p-8 text-center text-sm text-[#1F2A37]/50 shadow-sm">Loading report...</div>;
}
