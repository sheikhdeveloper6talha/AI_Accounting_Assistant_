require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const entriesRouter = require("./routes/entries");
const reportsRouter = require("./routes/reports");
const aiChatRouter = require("./routes/aiChat");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/entries", entriesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/ai-chat", aiChatRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
