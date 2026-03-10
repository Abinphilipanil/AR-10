import express from "express"
import { askLLM } from "../services/llm.service.js"

const router = express.Router()

const CAREER_SYSTEM_PROMPT = `You are an expert career advisor and resume specialist. 
You help users with:
- Resume tips and ATS optimization advice
- Interview preparation and job application strategies
- Career guidance, skill gap analysis, and growth planning
- LinkedIn profile improvement tips
- Salary negotiation advice

Rules:
- Be concise, practical, and actionable.
- Use bullet points for lists.
- If asked something unrelated to careers, politely redirect to career topics.
- Never make up job listings or specific company information.`

router.post("/", async (req, res) => {
  try {
    const { message, resumeContext } = req.body

    if (!message) {
      return res.status(400).json({ error: "Message required" })
    }

    // If the user's resume is available, include it for context-aware advice
    const contextualMessage = resumeContext
      ? `[User's Resume Context]\n${resumeContext}\n\n[User Question]\n${message}`
      : message

    const reply = await askLLM({ message: contextualMessage, systemHint: CAREER_SYSTEM_PROMPT })

    res.json({ reply })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Chat failed"
    console.error("Chat error:", msg)
    res.status(500).json({ error: msg })
  }
})

export default router