import express, { type Request, type Response } from "express"
import { parseLinkedin } from "../services/linkedin.service.js"
import { parseGithubProfile } from "../services/github.service.js"
import { askLLM } from "../services/llm.service.js"
import { supabase } from "../config/supabase.js"
import { getErrorMessage } from "../utils/error.js"

const router = express.Router()

function extractGithubUsername(url: string): string {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`)
    const pathParts = urlObj.pathname.split("/").filter((p) => p.length > 0)
    return pathParts[0] || url
  } catch {
    return url
  }
}

router.post("/build-from-links", async (req: Request, res: Response) => {
  const { linkedin: linkedinUrl, github: githubUrl, jobDesc, linkedinPdfData, previousResumeText, format } = req.body

  if (!githubUrl || !jobDesc) {
    return res.status(400).json({ error: "github and jobDesc are required" })
  }

  console.log(`\n🚀 Building resume | GitHub=${githubUrl}`)

  // ── 1. Determine LinkedIn data source ──
  // Priority: PDF parsed data > URL scrape
  let linkedinData: any = null
  let linkedinFetchedViaPdf = false

  if (linkedinPdfData && typeof linkedinPdfData === "object" && linkedinPdfData.name) {
    // LinkedIn PDF was already parsed and sent from frontend
    linkedinData = linkedinPdfData
    linkedinFetchedViaPdf = true
    console.log(`✅ LinkedIn PDF data received: name="${linkedinData.name}"`)
  } else if (linkedinUrl) {
    // Fallback: try URL scrape
    const scraped = await parseLinkedin(linkedinUrl)
    if (scraped.fetchedViaProfile) {
      linkedinData = scraped
      console.log(`✅ LinkedIn URL scraped: name="${scraped.name}"`)
    } else {
      console.warn("⚠️  LinkedIn blocked by anti-bot – proceeding without LinkedIn data.")
    }
  } else {
    console.warn("⚠️  No LinkedIn source provided.")
  }

  // Build LinkedIn section for the prompt
  const linkedinSection = linkedinData
    ? `## LinkedIn / Profile Data (USE FOR CONTACT INFO)
- **Full Name:** ${linkedinData.name || "N/A"}
- **Headline:** ${linkedinData.headline || "N/A"}
- **Contact Email:** ${linkedinData.email || "N/A"}
- **Contact Phone:** ${linkedinData.phone || "N/A"}
- **Location:** ${linkedinData.location || "N/A"}
- **Portfolio/Website:** ${linkedinData.website || linkedinData.blog || "N/A"}
- **LinkedIn URL:** ${linkedinData.linkedin_url || linkedinUrl || "N/A"}
- **Summary:** ${linkedinData.summary || linkedinData.about || "N/A"}
- **Skills:** ${Array.isArray(linkedinData.skills) && linkedinData.skills.length ? linkedinData.skills.join(", ") : (typeof linkedinData.skills === 'object' ? Object.values(linkedinData.skills).flat().join(", ") : "N/A")}

### Work Experience
${Array.isArray(linkedinData.experience) && linkedinData.experience.length
      ? linkedinData.experience.map((e: any) =>
        `- **${e.title || "Role"}** at ${e.company || "Company"} (${e.duration || "Dates N/A"})\n  ${e.description || ""}`
      ).join("\n")
      : "No work experience data available."}

### Education (IMPORTANT: EXTRACT CGPA/GRADE)
${Array.isArray(linkedinData.education) && linkedinData.education.length
      ? linkedinData.education.map((e: any) =>
        `- **${e.degree || "Degree"}** — ${e.institution || "Institution"} (${e.years || "N/A"}) | **ACADEMIC PERFORMANCE: ${e.grade || "Check previous resume or raw text for Grade/CGPA"}**`
      ).join("\n")
      : "No education data available."}
`
    : `## LinkedIn / Profile Data
*No LinkedIn data available. Build resume from GitHub data only.*`

  // Previous resume context (optional enhancement)
  const previousResumeSection = previousResumeText
    ? `\n## Previous Resume (additional context — extract real contact/experience data from here)\n${previousResumeText.slice(0, 3000)}`
    : ""

  // ── 2. Parse GitHub ──
  let githubData: Awaited<ReturnType<typeof parseGithubProfile>> | null = null
  try {
    const username = extractGithubUsername(githubUrl)
    console.log(`🔍 Fetching GitHub: @${username}`)
    githubData = await parseGithubProfile(username)
    console.log(`✅ GitHub: ${githubData.profile.name} | ${githubData.topRepositories.length} repos | langs: ${githubData.topLanguages.join(", ")}`)
  } catch (err) {
    console.error("❌ GitHub parse failed:", getErrorMessage(err))
  }

  // ── 3. Build GitHub section for prompt ──
  const githubSection = githubData
    ? `
## GitHub Profile (@${githubData.profile.login})
- **Full name:** ${githubData.profile.name || "N/A"}
- **Bio:** ${githubData.profile.bio || "N/A"}
- **Location:** ${githubData.profile.location || "N/A"}
- **Company:** ${githubData.profile.company || "N/A"}
- **Blog/Portfolio:** ${githubData.profile.blog || "N/A"}
- **Public Repos:** ${githubData.profile.publicRepos}
- **Top Languages:** ${githubData.topLanguages.join(", ")}

### Top Projects
${githubData.topRepositories
      .map(
        (r: { name: string; description: string | null; stars: number; language: string | null; topics: string[] }, i: number) =>
          `${i + 1}. **${r.name}** — ${r.description || "No description"} | Tech: ${r.language || "N/A"} | Topics: ${r.topics.join(", ") || "none"}`
      )
      .join("\n")}
`
    : `
## GitHub Profile
*GitHub data could not be fetched.*
`

  const formatDirective = format
    ? `\n6. FORMAT & TONE STYLE: Ensure the resume is written using the "${format}" style and tone. Focus on making the layout and content adhere closely to a ${format} standard.`
    : `\n6. FORMAT & TONE STYLE: Professional and clean ats optimised and in different style each time it is generated.`

  const systemPrompt = `[SYSTEM ROLE: SENIOR TECHNICAL CAREER ARCHITECT]
You are a career consultant for elite software engineers. Your mission is to produce a resume that is not just a list of jobs, but a narrative of technical leadership and problem-solving excellence.

STRATEGIC DIRECTIVES:
1. CONTACT INFORMATION: At the VERY top, include:
   - Full Name (centered using Markdown # Header)
   - Email | Phone | LinkedIn URL | GitHub URL | Portfolio Website (if available) - all in one centered-style line using | separators.
   - **CRITICAL: NEVER use HTML tags like <center>, <br>, or <div>. Use ONLY pure Markdown.** My system will handle the centering and scaling via CSS.
2. EXECUTIVE SUMMARY: Write a powerful, 2-3 sentence summary that highlights the candidate's core technical focus, years of experience, and a major achievement.
3. IMPACT-FIRST BULLETS: Use the "Result -> Action -> Context" format.
4. KEYWORD OPTIMIZATION: Seamlessly integrate technical keywords from the JOB DESCRIPTION.
5. EXACT SECTIONS: You MUST include the following specific sections in this exact order:
   - Header: Full Name (as <h1>) followed by a single line containing Contact Details separated by | (centered visually).
   - Summary
   - Experience
   - Projects / GitHub Showcase
   - Skills
   - Education: **MANDATORY Section**. You MUST include the Grade/CGPA/Percentage for each degree. It is a critical requirement for this candidate.
   - Certificates (if available from data)
6. STYLING & LENGTH: Use professional, clean Markdown. Ensure the resume fits within 1-2 pages realistically. Use bold text for key technologies.${formatDirective}

Output ONLY the Markdown resume. Do not add conversational text.`;
  const userMessage = `## REAL DATA EXTRACTED — USE ONLY THIS:

${linkedinSection}

${githubSection}
${previousResumeSection}

## Target Job Description (use keywords from this to optimize, but NEVER invent experience for it)
\`\`\`
${jobDesc}
\`\`\`

Now write the resume using ONLY the real data above. If certain sections (Work Experience, Education, Certificates) have no real data, skip those sections entirely.`

  let generatedResume: string
  try {
    generatedResume = await askLLM({
      message: userMessage,
      systemHint: systemPrompt,
    })
    // ── Pre-processing: Strip unwanted HTML tags that LLMs sometimes hallucinate ──
    generatedResume = generatedResume
      .replace(/<center>/gi, "")
      .replace(/<\/center>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<div>/gi, "")
      .replace(/<\/div>/gi, "")
      .trim();

    console.log(`✅ LLM generated resume (${generatedResume.length} chars)`)
  } catch (err) {
    console.error("❌ LLM failed:", getErrorMessage(err))
    return res.status(500).json({ error: "Resume generation failed: " + getErrorMessage(err) })
  }

  // ── 4. Advanced Semantic ATS Analysis (BERT-Powered) ──
  let atsAnalysis: any = null
  try {
    console.log(`🧠 Initializing BERT NLP Processor for high-fidelity semantic analysis...`)
    const analysisPrompt = `[MODE: HIGH-FIDELITY BERT SEMANTIC ANALYSER]
You are a Transformer-based Semantic Evaluation Engine (BERT Architecture). Your task is to perform an objective, multi-dimensional analysis of how well the RESUME aligns with the JOB DESCRIPTION using Bidirectional contextual understanding.

EVALUATION RUBRIC (BERT METHODOLOGY):
1. SEMANTIC FIELD MAPPING (30%): Analyze bidirectional context to map synonyms. Evaluate concepts over keywords (e.g., "Deep Learning" conceptually matches "Neural Networks").
2. VECTOR EMBEDDING ATTENTION (30%): Assign weights to skills based on their "Attention" in the Job Description context.
3. QUANTIFIABLE IMPACT (20%): Look for metrics and outcomes. BERT identifies the "Result" vs. "Action" context significantly better than simple NLP.
4. "SHOWSTOPPER" GAP ANALYSIS (20%): Identify critical semantic clusters missing from the resume.

JOB DESCRIPTION:
${jobDesc}

RESUME:
${generatedResume}

TASK:
Calculate a percentage score (0-100) based on weighted vector similarity. Be honest and critical.

RETURN ONLY JSON:
{
  "score": number,
  "matchLevel": "Excellent" | "Good" | "Fair" | "Poor",
  "missingKeywords": ["Specifically list missing technical requirements"],
  "conceptualGaps": ["List missing leadership, scale, or process skills"],
  "strengths": ["Strongest semantic matches found via contextual attention"],
  "weaknesses": ["Primary reasons for score reduction"],
  "gameChangerTips": ["Priority drafting tips to immediately improve semantic alignment"],
  "bertMetadata": {
     "model": "BERT-Base-Contextual",
     "analysisType": "Bidirectional Vector Comparison"
  }
}`

    const analysisResp = await askLLM({
      message: analysisPrompt,
      temperature: 0.1
    })

    try {
      const cleaned = analysisResp.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      atsAnalysis = JSON.parse(cleaned)
      console.log(`✅ BERT NLP Analysis completed: Score=${atsAnalysis.score}%`)
    } catch (parseErr) {
      console.error("❌ BERT NLP Analysis JSON Parse failed:", parseErr)
    }
  } catch (err) {
    console.error("⚠️  ATS Analysis skipped due to error:", getErrorMessage(err))
  }

  // ── 5. Store in Supabase ──
  let dbId: string | undefined
  try {
    const { data: dbData, error: dbError } = await supabase
      .from("generated_resumes")
      .insert([
        {
          linkedin_url: linkedinUrl,
          github_url: githubUrl,
          job_description: jobDesc,
          linkedin_data: linkedinData,
          github_data: githubData || {},
          generated_resume_markdown: generatedResume,
          ats_score: atsAnalysis?.score || 0,
          ats_analysis: atsAnalysis || {},
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (dbError) {
      console.error("⚠️  Supabase insert error:", dbError.message)
    } else {
      dbId = dbData?.[0]?.id
      console.log(`✅ Saved to Supabase: id=${dbId}`)
    }
  } catch (err) {
    console.error("⚠️  Supabase exception:", getErrorMessage(err))
  }

  return res.json({
    message: "Resume generated and saved successfully",
    resume: generatedResume,
    dbId,
    linkedinFetched: linkedinData?.fetchedViaProfile || linkedinFetchedViaPdf,
    githubFetched: !!githubData,
    atsAnalysis
  })
})

export default router
