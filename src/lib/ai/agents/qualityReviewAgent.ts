import type { JobAnalysis, JobIntakeInput } from "@/lib/db/types";

export type QualityReviewResult = {
  qualityScore: number;
  passed: boolean;
  warnings: string[];
  checks: {
    coverLetterWordCount: number;
    hasRequiredSections: boolean;
    scoreInRange: boolean;
    summaryAvoidsScoreText: boolean;
    bulletMetricsGrounded: boolean;
    missingKeywordsReasonable: boolean;
  };
};

const SCORE_TEXT_PATTERN = /\b\d{1,3}\s?%\b|\b\d{1,3}\s?\/\s?100\b/i;
const METRIC_PATTERN = /\b\d+[%x]?\b|\b\d+\s?(users|customers|applications|projects|hours|days|weeks|months)\b/i;

export function qualityReviewAgent(input: JobIntakeInput, analysis: JobAnalysis): QualityReviewResult {
  const warnings: string[] = [];
  const coverLetterWordCount = analysis.coverLetter.split(/\s+/).filter(Boolean).length;
  const hasRequiredSections = Boolean(
    analysis.summary &&
      analysis.requiredSkills.length &&
      analysis.strengths.length &&
      analysis.gaps.length &&
      analysis.suggestedBullets.length &&
      analysis.coverLetter
  );
  const scoreInRange = analysis.matchScore >= 0 && analysis.matchScore <= 100;
  const summaryAvoidsScoreText = !SCORE_TEXT_PATTERN.test(analysis.summary);
  const bulletMetricsGrounded = metricsAppearGrounded(input.resumeText, analysis.suggestedBullets);
  const missingKeywordsReasonable = analysis.missingKeywords.length <= analysis.requiredSkills.length + 3;

  if (!hasRequiredSections) warnings.push("One or more required analysis sections are empty.");
  if (!scoreInRange) warnings.push("Match score is outside the expected 0-100 range.");
  if (!summaryAvoidsScoreText) warnings.push("Summary includes score text that should be displayed separately.");
  if (coverLetterWordCount < 180) warnings.push("Cover letter is shorter than the minimum quality threshold.");
  if (coverLetterWordCount > 380) warnings.push("Cover letter is longer than the target range.");
  if (!bulletMetricsGrounded) warnings.push("Suggested bullets appear to include metrics not found in the resume text.");
  if (!missingKeywordsReasonable) warnings.push("Missing keyword list may be too broad for the extracted requirements.");

  const qualityScore = Math.max(0, 100 - warnings.length * 15);

  return {
    qualityScore,
    passed: warnings.length === 0,
    warnings,
    checks: {
      coverLetterWordCount,
      hasRequiredSections,
      scoreInRange,
      summaryAvoidsScoreText,
      bulletMetricsGrounded,
      missingKeywordsReasonable
    }
  };
}

function metricsAppearGrounded(resumeText: string, bullets: string[]) {
  const resumeHasMetrics = METRIC_PATTERN.test(resumeText);
  const bulletsHaveMetrics = bullets.some((bullet) => METRIC_PATTERN.test(bullet));

  return !bulletsHaveMetrics || resumeHasMetrics;
}
