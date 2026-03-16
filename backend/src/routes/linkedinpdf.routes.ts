import express, { type Request, type Response } from "express"
import multer from "multer"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { PDFParse } from "pdf-parse"
import { askLLM } from "../services/llm.service.js"
import { supabase } from "../config/supabase.js"

const router = express.Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.resolve(__dirname, "../../uploads")
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB limit

router.post("/parse-pdf", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "LinkedIn PDF file is required" })
    }

    console.log(`📄 Parsing LinkedIn PDF: ${req.file.originalname}`)

    // Extract raw text from PDF using PDFParse class (v2.x)
    const parser = new PDFParse({ data: req.file.buffer })
    const textResult = await parser.getText()
    const rawText = textResult.text
    await parser.destroy()

    if (!rawText || rawText.trim().length < 50) {
      return res.status(400).json({ error: "PDF appears to be empty or unreadable. Please export a text-based LinkedIn PDF." })
    }

    console.log(`📝 PDF text extracted (${rawText.length} chars), sending to Gemini...`)

    // Use Gemini to extract structured data from the raw PDF text
    const extractionPrompt = `[EXPERT NLP EXTRACTION]
Analyze the provided text from a LinkedIn PDF export.
Your task is to reconstruct a high-fidelity semantic model of this professional profile.

CRITICAL INSTRUCTIONS:
1. PRECISION: Extract exact names, dates, and locations.
2. SYNTHESIS: If a 'summary' is missing, generate a 2-sentence professional USP based on the experience records.
3. GRANULARITY: Differentiate technical skills from soft skills.
4. QUANTIFICATION: Identify metrics or impact statements in experience descriptions.

RETURN ONLY VALID JSON (No markdown fences):
{
  "name": "Full Name",
  "headline": "Professional Title",
  "email": "address or null",
  "phone": "number or null",
  "location": "City, Country or null",
  "website": "Portfolio URL or null",
  "linkedin_url": "LinkedIn URL or null",
  "summary": "Impactful summary",
  "skills": { "technical": [], "soft": [], "tools": [] },
  "experience": [
    { "title": "Role", "company": "Org", "duration": "Dates", "description": "Quantifiable description" }
  ],
  "education": [
    { "degree": "Degree", "institution": "University", "years": "Dates", "grade": "GPA/CGPA/Percentage (EXTRACT WITH HIGH PRIORITY)" }
  ],
  "projects": ["Impactful project descriptions"]
}

INPUT DATA:
---
${rawText.slice(0, 10000)}
---`

    const geminiResponse = await askLLM({ message: extractionPrompt })

    // Parse the JSON response
    let parsedData: Record<string, any> = {}
    try {
      // Strip any markdown fences if Gemini added them
      const cleaned = geminiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      parsedData = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error("Gemini JSON parse failed:", parseErr)
      // Return raw text at minimum
      parsedData = { name: "", headline: "", rawText: rawText.slice(0, 3000) }
    }

    // Store in Supabase
    try {
      await supabase.from("linkedin_profiles").insert([
        {
          raw_text: rawText.slice(0, 10000),
          parsed_data: parsedData,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (dbErr) {
      console.warn("Supabase store warning (non-fatal):", dbErr)
    }

    console.log(`✅ LinkedIn PDF parsed: name="${parsedData.name}"`)

    return res.json({
      success: true,
      data: parsedData,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("LinkedIn PDF parse error:", msg)
    return res.status(500).json({ error: msg })
  }
})

export default router
