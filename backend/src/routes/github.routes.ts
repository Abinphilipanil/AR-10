import express from "express"
import { parseGithubProfile } from "../services/github.service.js"

const router = express.Router()

router.post("/parse", async (req, res) => {
  try {
    const { username } = req.body as { username?: string }
    if (!username) return res.status(400).json({ error: "username is required" })

    const data = await parseGithubProfile(username)
    return res.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: msg })
  }
})

router.get("/parse", async (req, res) => {
  try {
    const username = String(req.query.username || "")
    if (!username) return res.status(400).json({ error: "username query param required" })

    const data = await parseGithubProfile(username)
    return res.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: msg })
  }
})

export default router