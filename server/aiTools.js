const { Transaction } = require("./models/Transaction");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthFromDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  return MONTHS[d.getMonth()];
}

// ---------------------------------------------------------------------------
// Tool: add_entry — create an income or expense record
// ---------------------------------------------------------------------------
async function addEntry({ type, amount, category, month, date, note }) {
  const resolvedDate = date ? new Date(date) : new Date();
  const entry = await Transaction.create({
    type,
    amount: Number(amount),
    category: (category || "other").toLowerCase(),
    month: month || monthFromDate(resolvedDate),
    date: resolvedDate,
    note: note || "",
    source: "ai",
  });
  return entry.toObject();
}

// ---------------------------------------------------------------------------
// Tool: query_entries — filtered lookup, used for "how much did we spend on X"
// ---------------------------------------------------------------------------
async function queryEntries({ type, category, month, startDate, endDate }) {
  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category.toLowerCase();
  if (month) filter.month = month;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const entries = await Transaction.find(filter).sort({ date: -1 }).lean();
  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  return { total, count: entries.length, entries: entries.slice(0, 20) };
}

// ---------------------------------------------------------------------------
// Tool: get_pl_report — income minus expenses for a period, by category
// ---------------------------------------------------------------------------
async function getPLReport({ month }) {
  const filter = month ? { month } : {};
  const entries = await Transaction.find(filter).lean();

  const income = entries.filter((e) => e.type === "income");
  const expenses = entries.filter((e) => e.type === "expense");

  const totalIncome = income.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = (list) =>
    Object.entries(
      list.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {})
    ).map(([category, amount]) => ({ category, amount }));

  return {
    month: month || "all time",
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    incomeByCategory: byCategory(income),
    expensesByCategory: byCategory(expenses),
  };
}

// ---------------------------------------------------------------------------
// Tool: get_balance_sheet — simplified cash-position snapshot (not full
// double-entry bookkeeping; this is a lightweight prototype view)
// ---------------------------------------------------------------------------
async function getBalanceSheet() {
  const entries = await Transaction.find().lean();
  const totalIncome = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpenses = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);

  return {
    asOf: new Date().toISOString().slice(0, 10),
    totalIncome,
    totalExpenses,
    netCashPosition: totalIncome - totalExpenses,
    note: "Simplified cash-basis snapshot — not a full double-entry balance sheet.",
  };
}

// ---------------------------------------------------------------------------
// Tool: get_audit — flags entries in a month that look worth a second look
// ---------------------------------------------------------------------------
async function getAudit({ month }) {
  const filter = month ? { month } : {};
  const entries = await Transaction.find(filter).lean();

  const byCategory = entries.reduce((acc, e) => {
    (acc[e.category] = acc[e.category] || []).push(e);
    return acc;
  }, {});

  const flags = [];

  for (const [category, list] of Object.entries(byCategory)) {
    const amounts = list.map((e) => e.amount).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    list.forEach((e) => {
      if (median && e.amount > median * 2) {
        flags.push({ id: e._id, reason: `Amount is more than 2x the median for "${category}"`, entry: e });
      }
      if (!e.note) {
        flags.push({ id: e._id, reason: "Missing note/description", entry: e });
      }
    });
  }

  return {
    month: month || "all time",
    entriesReviewed: entries.length,
    flaggedCount: flags.length,
    flags: flags.slice(0, 25),
  };
}

module.exports = { addEntry, queryEntries, getPLReport, getBalanceSheet, getAudit, monthFromDate, MONTHS };
