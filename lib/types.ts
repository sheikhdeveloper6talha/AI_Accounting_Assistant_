export type EntryType = "income" | "expense";

export interface Transaction {
  _id: string;
  type: EntryType;
  amount: number;
  category: string;
  month: string;
  date: string;
  note?: string;
  source: "manual" | "ai";
}

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export interface PLReport {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeByCategory: { category: string; amount: number }[];
  expensesByCategory: { category: string; amount: number }[];
}

export interface BalanceSheet {
  asOf: string;
  totalIncome: number;
  totalExpenses: number;
  netCashPosition: number;
  note: string;
}

export interface AuditFlag {
  id: string;
  reason: string;
  entry: Transaction;
}

export interface AuditReport {
  month: string;
  entriesReviewed: number;
  flaggedCount: number;
  flags: AuditFlag[];
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const EXPENSE_CATEGORIES = ["bijli", "rent", "maintenance", "salary", "supplies", "utilities", "marketing", "other"];
export const INCOME_CATEGORIES = ["sales", "consulting", "services", "other"];
