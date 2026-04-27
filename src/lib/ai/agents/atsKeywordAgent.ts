import type { JobAnalysis, JobIntakeInput } from "@/lib/db/types";

export type AtsKeywordResult = Pick<JobAnalysis, "requiredSkills" | "missingKeywords">;

export function atsKeywordAgent(input: JobIntakeInput, analysis: JobAnalysis): AtsKeywordResult {
  const resume = input.resumeText.toLowerCase();
  const missingKeywords = analysis.missingKeywords.filter((keyword) => !resume.includes(keyword.toLowerCase()));

  return {
    requiredSkills: analysis.requiredSkills,
    missingKeywords
  };
}
