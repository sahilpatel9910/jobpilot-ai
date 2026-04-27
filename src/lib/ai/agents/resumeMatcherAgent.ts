import type { JobAnalysis, JobIntakeInput } from "@/lib/db/types";

export type ResumeMatchResult = Pick<JobAnalysis, "matchScore" | "strengths" | "gaps" | "suggestedBullets">;

export function resumeMatcherAgent(input: JobIntakeInput, analysis: JobAnalysis): ResumeMatchResult {
  const resumeLength = input.resumeText.trim().split(/\s+/).length;
  const adjustedScore = resumeLength < 120 ? Math.max(analysis.matchScore - 8, 0) : analysis.matchScore;

  return {
    matchScore: adjustedScore,
    strengths: analysis.strengths,
    gaps: resumeLength < 120 ? ["Resume text is short; paste the full resume for a more accurate match.", ...analysis.gaps] : analysis.gaps,
    suggestedBullets: analysis.suggestedBullets
  };
}
