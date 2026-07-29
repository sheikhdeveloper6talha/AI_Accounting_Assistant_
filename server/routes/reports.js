const express = require("express");
const { getPLReport, getBalanceSheet, getAudit } = require("../aiTools");

const router = express.Router();

// GET /api/reports/pl?month=July
router.get("/pl", async (req, res) => {
  try {
    const report = await getPLReport({ month: req.query.month });
    res.json(report);
  } catch (err) {
    console.error("pl report error:", err.message);
    res.status(500).json({ error: "Could not generate P&L report." });
  }
});

// GET /api/reports/balance-sheet
router.get("/balance-sheet", async (req, res) => {
  try {
    const sheet = await getBalanceSheet();
    res.json(sheet);
  } catch (err) {
    console.error("balance sheet error:", err.message);
    res.status(500).json({ error: "Could not generate balance sheet." });
  }
});

// GET /api/reports/audit?month=July
router.get("/audit", async (req, res) => {
  try {
    const audit = await getAudit({ month: req.query.month });
    res.json(audit);
  } catch (err) {
    console.error("audit error:", err.message);
    res.status(500).json({ error: "Could not run audit." });
  }
});

module.exports = router;
