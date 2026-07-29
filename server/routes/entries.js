const express = require("express");
const { Transaction } = require("../models/Transaction");
const { monthFromDate } = require("../aiTools");

const router = express.Router();

// POST /api/entries — create a manual income or expense entry
router.post("/", async (req, res) => {
  try {
    const { type, amount, category, month, date, note } = req.body;

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ error: "type must be 'income' or 'expense'." });
    }
    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: "A valid positive amount is required." });
    }
    if (!category) {
      return res.status(400).json({ error: "category is required." });
    }

    const resolvedDate = date ? new Date(date) : new Date();
    const entry = await Transaction.create({
      type,
      amount: Number(amount),
      category: category.toLowerCase(),
      month: month || monthFromDate(resolvedDate),
      date: resolvedDate,
      note: note || "",
      source: "manual",
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error("create entry error:", err.message);
    res.status(500).json({ error: "Could not save entry." });
  }
});

// GET /api/entries — list with filters
router.get("/", async (req, res) => {
  try {
    const { type, category, month, startDate, endDate } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category.toLowerCase();
    if (month) filter.month = month;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const entries = await Transaction.find(filter).sort({ date: -1 });
    const totalIncome = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const totalExpenses = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);

    res.json({ entries, totalIncome, totalExpenses, net: totalIncome - totalExpenses });
  } catch (err) {
    console.error("list entries error:", err.message);
    res.status(500).json({ error: "Could not fetch entries." });
  }
});

// PUT /api/entries/:id — update an entry
router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.category) updates.category = updates.category.toLowerCase();
    const entry = await Transaction.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!entry) return res.status(404).json({ error: "Entry not found." });
    res.json(entry);
  } catch (err) {
    console.error("update entry error:", err.message);
    res.status(500).json({ error: "Could not update entry." });
  }
});

// DELETE /api/entries/:id
router.delete("/:id", async (req, res) => {
  try {
    const entry = await Transaction.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: "Entry not found." });
    res.json({ deleted: true });
  } catch (err) {
    console.error("delete entry error:", err.message);
    res.status(500).json({ error: "Could not delete entry." });
  }
});

module.exports = router;
