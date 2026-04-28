import type { QualityReviewResult } from "@/lib/ai/agents/qualityReviewAgent";
import type { JobAnalysis, JobIntakeInput } from "@/lib/db/types";

export const SYSTEM_PROMPT = `You are JobPilot AI, an expert career coach, recruiter, and ATS optimization specialist.
Analyse a job description against a candidate resume.
Return strict JSON only. Do not include markdown.
Be specific, ATS-aware, and practical. Do not invent experience that is not present in the resume.
The cover letter must be professional, confident, natural, and 250-350 words.
Every claim must be grounded in the provided resume text. If evidence is missing, list it as a gap instead of inventing it.
Prioritize direct role alignment, measurable achievements when present, transferable skills where needed, and human-sounding writing over generic buzzwords.`;

export function buildJobAnalysisPrompt(input: JobIntakeInput) {
  return `Company: ${input.companyName}
Job title: ${input.jobTitle}
Job URL: ${input.jobUrl || "Not provided"}

Job description:
${input.jobDescription}

Resume:
${input.resumeText}

Return JSON with this exact shape:
{
  "summary": "2-3 sentences. Do not include a percentage or score in this text.",
  "requiredSkills": ["string"],
  "matchScore": 0,
  "missingKeywords": ["string"],
  "strengths": ["string"],
  "gaps": ["string"],
  "suggestedBullets": ["string"],
  "coverLetter": "string"
}

Rules:
- Return only valid JSON. No markdown, no commentary, no code fences.
- matchScore must be an integer from 0 to 100.
- The summary must not mention a score, percentage, or "x/100"; the app displays the score separately.
- requiredSkills should contain 6-10 role requirements from the job description.
- missingKeywords should contain ATS terms present in the job description but missing or weak in the resume.
- strengths must cite real evidence from the resume.
- gaps must be honest and must not penalize the candidate for requirements not present in the job description.
- suggestedBullets must be rewritten resume bullets based only on real resume evidence. Do not fabricate metrics.
- coverLetter must be 250-350 words and tailored to the company and role.

Cover letter criteria:
- Strong opening: mention the role, company, interest, and a quick value proposition.
- Match the candidate's most relevant experience directly to the job requirements.
- Use alignment language naturally, such as "aligns with", "directly supports", or "demonstrated through".
- Prioritize the most relevant experience instead of summarizing the whole resume.
- Focus on impact and problem solving, not just responsibilities.
- Include measurable achievements only when they are present in the resume; never invent numbers.
- Naturally include important ATS keywords from the job description without keyword stuffing.
- If the resume lacks a requirement, compensate honestly with transferable skills, project evidence, or learning ability.
- Avoid repeating resume wording verbatim.
- If company name is provided, personalize the tone and message accordingly.
- Closing should show enthusiasm, include a concise call to action, and sound confident.
- The cover letter must be final polished text only inside the coverLetter field. Do not include explanatory bullets or notes.`;
}

export function buildAnalysisRepairPrompt(
  input: JobIntakeInput,
  analysis: JobAnalysis,
  review: QualityReviewResult
) {
  return `Company: ${input.companyName}
Job title: ${input.jobTitle}
Job URL: ${input.jobUrl || "Not provided"}

Job description:
${input.jobDescription}

Resume:
${input.resumeText}

Current analysis JSON:
${JSON.stringify(analysis, null, 2)}

Quality review result:
${JSON.stringify(
  {
    qualityScore: review.qualityScore,
    warnings: review.warnings,
    recommendations: review.recommendations,
    categoryScores: review.categoryScores,
    checks: review.checks
  },
  null,
  2
)}

Repair task:
Revise the current analysis so it addresses the quality review warnings and recommendations.
Keep sections that already satisfy the review. Change only what is needed to improve quality, grounding, ATS relevance, and cover-letter fit.

Return JSON with this exact shape:
{
  "summary": "2-3 sentences. Do not include a percentage or score in this text.",
  "requiredSkills": ["string"],
  "matchScore": 0,
  "missingKeywords": ["string"],
  "strengths": ["string"],
  "gaps": ["string"],
  "suggestedBullets": ["string"],
  "coverLetter": "string"
}

Repair rules:
- Return only valid JSON. No markdown, commentary, code fences, or explanation.
- Do not invent experience, tools, employers, metrics, projects, education, or achievements not present in the resume.
- If evidence is weak or missing, express that honestly in gaps rather than fabricating fit.
- The summary must not mention score text, percentages, or "x/100".
- matchScore must be an integer from 0 to 100 and consistent with the strengths/gaps.
- requiredSkills and missingKeywords must come from the job description.
- strengths and suggestedBullets must be traceable to the resume text.
- Suggested bullets may improve wording and positioning, but cannot add fake metrics.
- Cover letter must mention ${input.companyName} and the ${input.jobTitle} role naturally.
- Cover letter must be professional, confident, natural, ATS-aware, and 250-350 words.
- Avoid generic openings like "I am writing to apply".`;
}
