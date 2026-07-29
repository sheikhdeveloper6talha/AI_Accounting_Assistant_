const mongoose = require("mongoose");

// Suggested categories (kept as free strings, not hard enums, since real
// accounting categories vary by business — the UI offers a curated list).
const EXPENSE_CATEGORIES = ["bijli", "rent", "maintenance", "salary", "supplies", "utilities", "marketing", "other"];
const INCOME_CATEGORIES = ["sales", "consulting", "services", "other"];

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, lowercase: true },
    month: { type: String, required: true }, // e.g. "July"
    date: { type: Date, required: true },
    note: { type: String, default: "" },
    source: { type: String, enum: ["manual", "ai"], default: "manual" },
  },
  { timestamps: true }
);

transactionSchema.index({ type: 1, month: 1, category: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES };
