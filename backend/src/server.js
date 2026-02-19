import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { geminiChat } from "./gemini.js";
import { listGeminiModels } from "./models.js";

const app = express(); // ✅ app must be created before app.get/app.post

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

// ✅ List available models for YOUR API key
app.get("/api/models", async (_req, res) => {
  try {
    const data = await listGeminiModels();
    res.json(data);
  } catch (err) {
    console.error("ListModels error:", err?.response?.status, err?.response?.data || err);
    res.status(500).json({ error: "List models failed" });
  }
});

// ✅ Gemini-powered chatbot
app.post("/api/chat", async (req, res) => {
  try {
    const { message, messages } = req.body || {};

    const systemHint =
      "You are an ATS-focused Resume Assistant. Answer concisely, ask clarifying questions when needed, and give actionable bullet points.";

    const reply = await geminiChat({ message, messages, systemHint });
    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err?.response?.status, err?.response?.data || err);
    res.status(500).json({ error: "Gemini request failed." });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
