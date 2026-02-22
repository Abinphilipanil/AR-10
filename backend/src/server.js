import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { geminiChat } from "./gemini.js";
import { listGeminiModels } from "./models.js";

const app = express();

// ✅ If you use Vite proxy in dev, CORS is not required.
// Still useful for production (Vercel frontend calling backend directly).
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // allow same-origin / server-to-server calls (no Origin header)
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

app.get("/api/models", async (_req, res) => {
  try {
    const data = await listGeminiModels();
    return res.status(200).json(data);
  } catch (err) {
    const status = err?.response?.status || 500;
    const payload = err?.response?.data || { error: err?.message || "List models failed" };
    console.error("ListModels error:", status, payload);
    return res.status(status).json(payload);
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, messages } = req.body || {};

    if (!message && (!Array.isArray(messages) || messages.length === 0)) {
      return res.status(400).json({ error: "message (string) or messages (array) is required" });
    }

    const systemHint =
      "You are an ATS-focused Resume Assistant. Answer concisely, ask clarifying questions when needed. And suggest courses for the skill improvement and give the answer in a better format and give answer as a paragraph be more professional";

    const reply = await geminiChat({ message, messages, systemHint });
    return res.status(200).json({ reply });
  } catch (err) {
    // ✅ Preserve Gemini’s status and message when available
    const status = err?.response?.status || 500;
    const payload = err?.response?.data || { error: err?.message || "Gemini request failed" };

    console.error("Chat error:", status, payload);
    return res.status(status).json(payload);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));