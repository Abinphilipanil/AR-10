import express, { type Request, type Response } from "express"
import { parseLinkedin } from "../services/linkedin.service.js"
import { getErrorMessage } from "../utils/error.js"

const router = express.Router()

router.post("/parse", async (req: Request, res: Response) => {
  try {
    const { url } = req.body as { url?: string }

    if (!url) return res.status(400).json({ error: "url is required" })

    const data = await parseLinkedin(url)
    return res.json(data)
  } catch (err) {
    return res.status(500).json({ error: getErrorMessage(err) })
  }
})

export default router