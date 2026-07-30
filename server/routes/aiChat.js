const express = require("express");
const Groq = require("groq-sdk");
require("dotenv").config();

const { addEntry, queryEntries, getPLReport, getBalanceSheet, getAudit, MONTHS } = require("../aiTools");

const router = express.Router();

// Initialize Groq Client (GROQ_API_KEY .env me honi chahiye)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Groq / OpenAI Compatible Tools Array Structure
const tools = [
  {
    type: "function",
    function: {
      name: "add_entry",
      description: "Record a new income or expense entry, e.g. 'Add office rent 50000 for July' or 'aj bijli ka bill 50000 aya hai'.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["income", "expense"] },
          amount: { type: "number" },
          category: { type: "string", description: "e.g. bijli, rent, maintenance, salary, supplies, utilities, marketing, sales, consulting, other" },
          month: { type: "string", enum: MONTHS },
          date: { type: "string", description: "YYYY-MM-DD, defaults to today if omitted" },
          note: { type: "string" },
        },
        required: ["type", "amount", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_entries",
      description: "Look up and total existing entries, e.g. 'How much did we spend on utilities in March?'",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string" },
          month: { type: "string", enum: MONTHS },
          startDate: { type: "string" },
          endDate: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pl_report",
      description: "Generate a Profit & Loss statement, optionally for one month.",
      parameters: {
        type: "object",
        properties: { month: { type: "string", enum: MONTHS } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_balance_sheet",
      description: "Get a simplified cash-position balance sheet snapshot.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_audit",
      description: "Run an audit for a month, flagging unusual or incomplete entries.",
      parameters: {
        type: "object",
        properties: { month: { type: "string", enum: MONTHS } },
      },
    },
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
  console.log("call chat via Groq");

  try {
    const { message, history = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    // OpenAI/Groq array format for messages
    const messages = [
      { role: "system", content: SYSTEM_PROMPT }
    ];

    // Previous history inject karna
    history.slice(-6).forEach((h) => {
      messages.push({
        role: h.role === "ai" ? "assistant" : "user",
        content: h.text,
      });
    });

    // Current user message
    messages.push({ role: "user", content: message.trim() });

    // Pass 1: Call Groq model with tools
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;
    let toolResultPayload = null;
    let toolName = null;
    let finalReply = responseMessage.content;

    // Check if Groq requested function tool call
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || "{}");

      const impl = TOOL_IMPL[toolName];
      toolResultPayload = impl ? await impl(args) : { error: "Unknown tool." };

      // Append assistant's response and tool result to messages array
      messages.push(responseMessage);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResultPayload),
      });

      // Pass 2: Send tool output back to Groq for summary response
      const secondResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: messages,
      });

      finalReply = secondResponse.choices[0].message.content;
    }

    res.json({
      reply: finalReply || "Ho gaya.",
      tool: toolName,
      data: toolResultPayload,
    });
  } catch (err) {
    console.error("ai-chat error:", err.message);

    if (err.message && (err.message.includes("429") || err.message.includes("rate_limit"))) {
      return res.status(429).json({
        reply: "Boht tez requests aa rahi hain, thodi der baad try karein.",
        error: "Rate limit hit",
      });
    }

    res.status(500).json({ error: "AI chat failed." });
  }
});

module.exports = router;