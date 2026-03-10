import express from "express"
import multer from "multer"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

import { parseResume } from "../services/resume.service.js"

const router = express.Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.resolve(__dirname, "../../uploads")

// create folder only if it does not exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.memoryStorage()
const upload = multer({ storage })

router.post("/upload", upload.single("resume"), async (req, res) => {

  try {

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "Resume file missing" })
    }

    const data = await parseResume(req.file.buffer)

    res.json(data)

  } catch (error) {

    res.status(500).json({ error: "Resume parsing failed" })

  }

})

export default router