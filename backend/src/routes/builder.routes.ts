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
  const { linkedin: linkedinUrl, github: githubUrl, jobDesc, linkedinPdfData, previousResumeText } = req.body

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
    ? `## LinkedIn / Profile Data
- **Name:** ${linkedinData.name || "N/A"}
- **Headline:** ${linkedinData.headline || "N/A"}
- **Email:** ${linkedinData.email || "N/A"}
- **Phone:** ${linkedinData.phone || "N/A"}
- **Location:** ${linkedinData.location || "N/A"}
- **Website:** ${linkedinData.website || linkedinData.blog || "N/A"}
- **Summary:** ${linkedinData.summary || linkedinData.about || "N/A"}
- **Skills:** ${Array.isArray(linkedinData.skills) && linkedinData.skills.length ? linkedinData.skills.join(", ") : "N/A"}
- **Languages:** ${Array.isArray(linkedinData.languages) && linkedinData.languages.length ? linkedinData.languages.join(", ") : "N/A"}

### Work Experience
${Array.isArray(linkedinData.experience) && linkedinData.experience.length
  ? linkedinData.experience.map((e: any) =>
      `- **${e.title || "Role"}** at ${e.company || "Company"} (${e.duration || "Dates N/A"})\n  ${e.description || ""}`
    ).join("\n")
  : "No work experience data available."}

### Education
${Array.isArray(linkedinData.education) && linkedinData.education.length
  ? linkedinData.education.map((e: any) =>
      `- **${e.degree || "Degree"}** — ${e.institution || "Institution"} (${e.years || "N/A"})${e.grade ? ` | Grade: ${e.grade}` : ""}`
    ).join("\n")
  : "No education data available."}

### Certifications
${Array.isArray(linkedinData.certifications) && linkedinData.certifications.length
  ? linkedinData.certifications.join(", ")
  : "None listed."}`
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

  const systemPrompt = `[SYSTEM ROLE: SENIOR TECHNICAL CAREER ARCHITECT]
You are a career consultant for elite software engineers. Your mission is to produce a resume that is not just a list of jobs, but a narrative of technical leadership and problem-solving excellence.

STRATEGIC DIRECTIVES:
1. EXECUTIVE SUMMARY: Write a powerful, 3-sentence summary that highlights the candidate's core technical focus, years of experience, and a major achievement (e.g., scale, latency, or business impact).
2. IMPACT-FIRST BULLETS: Use the "Result -> Action -> Context" format. (e.g., "Reduced server costs by 30% by refactoring the caching layer in Go...").
3. KEYWORD OPTIMIZATION: Seamlessly integrate technical keywords from the JOB DESCRIPTION into the Work Experience and Projects sections where appropriate, based on the candidate's real data.
4. GITHUB SHOWCASE: Treat GitHub repositories as professional portfolio pieces. Highlight specific technical challenges solved (e.g., "Implemented a custom O(log n) search algorithm...").
5. CLEAN STRUCTURE: Ensure sections are logically ordered: Summary, Technical Skills, Experience, Projects, Education.

STYLING:
- Professional, clean Markdown structure.
- Use bold text for key technologies within bullet points for better readability.
- Clear headers and horizontal dividers between sections.

Output ONLY the Markdown resume. Do not add conversational text.`

  const userMessage = `## REAL DATA EXTRACTED — USE ONLY THIS:

${linkedinSection}

${githubSection}
${previousResumeSection}

## Target Job Description (use keywords from this to optimize, but NEVER invent experience for it)
\`\`\`
${jobDesc}
\`\`\`

Now write the resume using ONLY the real data above. If certain sections (Work Experience, Education) have no real data, skip those sections entirely.`

  let generatedResume: string
  try {
    generatedResume = await askLLM({
      message: userMessage,
      systemHint: systemPrompt,
    })
    console.log(`✅ LLM generated resume (${generatedResume.length} chars)`)
  } catch (err) {
    console.error("❌ LLM failed:", getErrorMessage(err))
    return res.status(500).json({ error: "Resume generation failed: " + getErrorMessage(err) })
  }

  // ── 4. Advanced Semantic ATS Analysis ──
  let atsAnalysis: any = null
  try {
    console.log(`🧠 Performing advanced semantic analysis...`)
    const analysisPrompt = `[MODE: HIGH-FIDELITY SEMANTIC ATS ANALYSER]
You are a rigorous Semantic Evaluation Engine. Your task is to perform an objective, multi-dimensional analysis of how well the RESUME aligns with the JOB DESCRIPTION.

EVALUATION RUBRIC:
1. SEMANTIC FIELD MAPPING (30%): Map synonyms and related concepts (e.g., "Kubernetes" maps to "Container Orchestration"). Evaluate the breath and depth of the tech stack.
2. SENIORITY & DOMAIN MATCH (30%): Does the candidate's career level (Junior, Senior, etc.) and industry context align with the JD requirements?
3. QUANTIFIABLE IMPACT (20%): Look for metrics, scale, and specific outcomes. Penalize generic "responsibilities" lists.
4. "SHOWSTOPPER" GAP ANALYSIS (20%): Identify critical requirements in the JD that are entirely missing from the resume.

JOB DESCRIPTION:
${jobDesc}

RESUME:
${generatedResume}

TASK:
Calculate a percentage score (0-100) based on the weights above. Be honest and critical; a 100% score is only for a perfect match.

RETURN ONLY JSON:
{
  "score": number,
  "matchLevel": "Excellent" | "Good" | "Fair" | "Poor",
  "missingKeywords": ["Specifically list missing technical requirements"],
  "conceptualGaps": ["List missing leadership, scale, or process skills"],
  "strengths": ["Strongest semantic matches Found"],
  "weaknesses": ["Primary reasons for score reduction"],
  "gameChangerTips": ["Priority drafting tips to immediately improve alignment"]
}`

    const analysisResp = await askLLM({
      message: analysisPrompt,
      temperature: 0.1
    })

    try {
      const cleaned = analysisResp.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      atsAnalysis = JSON.parse(cleaned)
      console.log(`✅ ATS Analysis completed: Score=${atsAnalysis.score}%`)
    } catch (parseErr) {
      console.error("❌ ATS Analysis JSON Parse failed:", parseErr)
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
