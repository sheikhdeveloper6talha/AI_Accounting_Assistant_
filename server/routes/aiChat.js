const express = require("express");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const { addEntry, queryEntries, getPLReport, getBalanceSheet, getAudit, MONTHS } = require("../aiTools");

const router = express.Router();

// Initialize Google Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Function declarations for Gemini tools
const tools = [
  {
    functionDeclarations: [
      {
        name: "add_entry",
        description: "Record a new income or expense entry, e.g. 'Add office rent 50000 for July' or 'aj bijli ka bill 50000 aya hai'.",
        parameters: {
          type: "OBJECT",
          properties: {
            type: { type: "STRING", enum: ["income", "expense"] },
            amount: { type: "NUMBER" },
            category: { type: "STRING", description: "e.g. bijli, rent, maintenance, salary, supplies, utilities, marketing, sales, consulting, other" },
            month: { type: "STRING", enum: MONTHS },
            date: { type: "STRING", description: "YYYY-MM-DD, defaults to today if omitted" },
            note: { type: "STRING" },
          },
          required: ["type", "amount", "category"],
        },
      },
      {
        name: "query_entries",
        description: "Look up and total existing entries, e.g. 'How much did we spend on utilities in March?'",
        parameters: {
          type: "OBJECT",
          properties: {
            type: { type: "STRING", enum: ["income", "expense"] },
            category: { type: "STRING" },
            month: { type: "STRING", enum: MONTHS },
            startDate: { type: "STRING" },
            endDate: { type: "STRING" },
          },
        },
      },
      {
        name: "get_pl_report",
        description: "Generate a Profit & Loss statement, optionally for one month.",
        parameters: {
          type: "OBJECT",
          properties: { month: { type: "STRING", enum: MONTHS } },
        },
      },
      {
        name: "get_balance_sheet",
        description: "Get a simplified cash-position balance sheet snapshot.",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "get_audit",
        description: "Run an audit for a month, flagging unusual or incomplete entries.",
        parameters: {
          type: "OBJECT",
          properties: { month: { type: "STRING", enum: MONTHS } },
        },
      },
    ],
  },
];

const TOOL_IMPL = {
  add_entry: addEntry,
  query_entries: queryEntries,
  get_pl_report: getPLReport,
  get_balance_sheet: getBalanceSheet,
  get_audit: getAudit,
};

const SYSTEM_PROMPT = `You are an AI accounting assistant for a small business. Users write in Urdu, Roman Urdu, or English.
Today's date is ${new Date().toISOString().slice(0, 10)}. Resolve relative words like "aj" (today) and "is mahine" (this month) using that date.

Use the available tools to add entries, look up spending, or generate reports (P&L, balance sheet, audit) — never guess numbers yourself, always call a tool.
After a tool returns, reply in one short, natural sentence mixing Roman Urdu/English the way the user wrote.`;

// POST /api/ai-chat
router.post("/", async (req, res) => {
  console.log('call chat');
  
  try {
    const { message, history = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Convert history format to text prompt context
    let formattedPrompt = `${SYSTEM_PROMPT}\n\n`;
    history.slice(-6).forEach((h) => {
      formattedPrompt += `${h.role === "ai" ? "Assistant" : "User"}: ${h.text}\n`;
    });
    formattedPrompt += `User: ${message.trim()}`;

    // Pass 1: Call Gemini model with tools
    let response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: formattedPrompt,
      config: {
        tools: tools,
      },
    });

    let toolResultPayload = null;
    let toolName = null;
    let finalReply = response.text;

    // Check if Gemini requested a function/tool call
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      toolName = call.name;
      const args = call.args || {};

      const impl = TOOL_IMPL[toolName];
      toolResultPayload = impl ? await impl(args) : { error: "Unknown tool." };

      // Pass 2: Send tool results back to Gemini for final response
      const secondPassPrompt = `${formattedPrompt}\nTool '${toolName}' executed with result: ${JSON.stringify(toolResultPayload)}.\nProvide a short, concise summary response to the user.`;

      const secondResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: secondPassPrompt,
      });

      finalReply = secondResponse.text;
    }

    res.json({
      reply: finalReply || "Ho gaya.",
      tool: toolName,
      data: toolResultPayload,
    });
  } catch (err) {
    console.error("ai-chat error:", err.message);

    if (err.message && err.message.includes("429")) {
      return res.status(429).json({
        reply: "Boht tez requests aa rahi hain, 20 seconds baad try karein.",
        error: "Rate limit hit",
      });
    }

    res.status(500).json({ error: "AI chat failed." });
  }
});

module.exports = router;