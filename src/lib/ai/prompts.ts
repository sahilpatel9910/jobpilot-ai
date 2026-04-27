import type { JobIntakeInput } from "@/lib/db/types";

export const SYSTEM_PROMPT = `You are JobPilot AI, a careful job-search assistant.
Analyse a job description against a candidate resume.
Return strict JSON only. Do not include markdown.
Be specific, ATS-aware, and practical. Do not invent experience that is not present in the resume.
The cover letter must be professional, confident, natural, and 250-350 words.`;

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
  "summary": "string",
  "requiredSkills": ["string"],
  "matchScore": 0,
  "missingKeywords": ["string"],
  "strengths": ["string"],
  "gaps": ["string"],
  "suggestedBullets": ["string"],
  "coverLetter": "string"
}`;
}
