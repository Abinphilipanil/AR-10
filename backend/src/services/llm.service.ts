import axios from "axios"

export type LLMOptions = {
  message: string
  systemHint?: string
  temperature?: number
}

export async function askLLM({ message, systemHint, temperature = 0.2 }: LLMOptions): Promise<string> {
  const GROQ_KEY = process.env.GROQ_API_KEY
  const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"

  if (GROQ_KEY) {
    try {
      console.log(`🚀 Groq: Analyzing using ${GROQ_MODEL}...`)
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: GROQ_MODEL,
          messages: [
            ...(systemHint ? [{ role: "system", content: systemHint }] : []),
            { role: "user", content: message }
          ],
          temperature
        },
        {
          headers: {
            "Authorization": `Bearer ${GROQ_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      )
      const result = response.data?.choices?.[0]?.message?.content
      if (result) {
        console.log(`✅ Groq Success (Llama 3.3)`)
        return result
      }
    } catch (err: any) {
      console.warn(`⚠️  Groq failed or timed out: ${err.message}. Falling back to Gemini...`)
    }
  }

  return await askGeminiRaw(message, systemHint, temperature)
}

async function askGeminiRaw(message: string, systemHint?: string, temperature: number = 0.2): Promise<string> {
  const API_KEY = process.env.GEMINI_API_KEY
  const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash"

  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY not set in environment variables")
  }

  console.log(`🔄 Gemini: Processing with ${MODEL}...`)

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

  const contents = systemHint
    ? [
        { role: "user", parts: [{ text: systemHint }] },
        { role: "model", parts: [{ text: "Understood. I will follow these instructions strictly." }] },
        { role: "user", parts: [{ text: message }] },
      ]
    : [{ role: "user", parts: [{ text: message }] }]

  const maxRetries = 3  // reduced from 5
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      const response = await axios.post(
        url,
        { contents, generationConfig: { temperature } },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
          },
          timeout: 55000, // ✅ 55s timeout — just under Render's 60s limit
        }
      )

      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error("Empty response from Gemini")

      console.log(`✅ Gemini Success`)
      return text

    } catch (error: any) {
      attempt++

      if (error.response?.status === 429) {
        console.warn(`🚫 Gemini Quota (Attempt ${attempt}/${maxRetries}). Waiting 5s...`)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 5000))
          continue
        }
        throw new Error("Gemini Quota Exceeded. Please try again in 1 minute.")
      }

      if (error.code === "ECONNABORTED") {
        console.warn(`⏱️ Gemini timed out (Attempt ${attempt}/${maxRetries})`)
        if (attempt < maxRetries) continue
        throw new Error("Gemini request timed out. Please try again.")
      }

      const msg = error.response?.data?.error?.message || error.message
      throw new Error(`Gemini API Error: ${msg}`)
    }
  }

  throw new Error("Failed to get response from any LLM provider.")
}
