# AI Accounting Assistant — Prototype

A personal prototype of an AI-powered bookkeeping assistant: manual entry forms,
a natural-language chat agent (Urdu/Roman Urdu/English), and generated reports
(P&L, simplified balance sheet, monthly audit).

> **Note:** this uses **Express + MongoDB** for speed. If this needs to satisfy
> the intern assignment brief, that brief requires **FastAPI + PostgreSQL +
> Pydantic + an agentic framework (LangGraph/CrewAI/OpenAI Agents SDK) +
> Docker + a research paper + a Lucidchart/draw.io diagram** — none of which
> this prototype provides. Keep this as a working reference/demo, not the
> submission itself.

## Stack

- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Backend: Express + Mongoose (MongoDB)
- AI: OpenAI `gpt-4o-mini` with function/tool calling as a lightweight agent loop

## Project structure

```
app/                Next.js pages (Ledger, Add Entry, AI Assistant, Reports)
lib/                 Shared types + fetch helper
server/              Express API
  models/            Mongoose schema
  routes/             entries, reports, ai-chat
  aiTools.js          Functions the AI agent can call (add/query/report/audit)
```

## Setup

**1. Backend**

```bash
cd server
npm install
cp ../.env.example .env   # fill in MONGODB_URI and OPENAI_API_KEY
npm run dev                # http://localhost:5000
```

**2. Frontend** (from the project root)

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev                   # http://localhost:3000
```

You'll need a MongoDB instance (local `mongod`, or a free Atlas cluster) and
an OpenAI API key with access to `gpt-4o-mini`.

## What each section does

- **Ledger** (`/`) — all income/expense entries, filterable by type, category,
  month, or date range, with running totals.
- **Add Entry** (`/add`) — manual form for income or expense records.
- **AI Assistant** (`/chat`) — natural-language chat. The agent can call four
  tools: `add_entry`, `query_entries`, `get_pl_report`, `get_balance_sheet`,
  `get_audit`, all backed by live MongoDB queries (see `server/aiTools.js`).
- **Reports** (`/reports`) — P&L by month, a simplified cash-position balance
  sheet, and a monthly audit that flags entries missing notes or unusually
  large relative to their category's median.

## Known simplifications (prototype, not production)

- Balance sheet is a simplified cash-position snapshot, not full double-entry
  bookkeeping (no assets/liabilities/equity tracking).
- Audit flagging uses a simple median-based heuristic, not real anomaly detection.
- No auth — anyone with the URL can read/write data.
- Categories are free-text strings with a curated dropdown, not enforced enums.
