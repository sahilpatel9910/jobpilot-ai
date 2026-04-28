import type { JobAnalysis, JobIntakeInput } from "@/lib/db/types";

export type QualityReviewResult = {
  qualityScore: number;
  passed: boolean;
  warnings: string[];
  recommendations: string[];
  categoryScores: {
    structure: number;
    jobAlignment: number;
    resumeGrounding: number;
    atsCoverage: number;
    coverLetterQuality: number;
  };
  checks: {
    coverLetterWordCount: number;
    hasRequiredSections: boolean;
    scoreInRange: boolean;
    summaryAvoidsScoreText: boolean;
    bulletMetricsGrounded: boolean;
    missingKeywordsReasonable: boolean;
    requiredSkillCoverageRatio: number;
    missingKeywordCoverageRatio: number;
    coverLetterMentionsCompany: boolean;
    coverLetterMentionsRole: boolean;
    coverLetterAvoidsGenericOpening: boolean;
    coverLetterAvoidsTemplateLanguage: boolean;
    coverLetterUsesNamedResumeEvidence: boolean;
    employerQuestionsAddressed: boolean;
    strengthsGroundedRatio: number;
    suggestedBulletsGroundedRatio: number;
  };
};

const SCORE_TEXT_PATTERN = /\b\d{1,3}\s?%\b|\b\d{1,3}\s?\/\s?100\b/i;
const METRIC_PATTERN = /\b\d+[%x]?\b|\b\d+\s?(users|customers|applications|projects|hours|days|weeks|months)\b/i;
const GENERIC_OPENINGS = [
  "i am writing to apply",
  "please accept my application",
  "i believe i would be a good fit",
  "your focus",
  "your mission",
  "your commitment"
];
const TEMPLATE_PHRASES = [
  "aligns perfectly with my passion",
  "continued success",
  "i would welcome the opportunity to discuss",
  "thank you for considering my application",
  "i am confident i can contribute immediately"
];

export function qualityReviewAgent(input: JobIntakeInput, analysis: JobAnalysis): QualityReviewResult {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const normalizedJobText = normalize(`${input.companyName} ${input.jobTitle} ${input.jobDescription}`);
  const normalizedResumeText = normalize(input.resumeText);
  const normalizedCoverLetter = normalize(analysis.coverLetter);
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
  const requiredSkillCoverageRatio = coverageRatio(analysis.requiredSkills, normalizedJobText);
  const missingKeywordCoverageRatio = coverageRatio(analysis.missingKeywords, normalizedJobText);
  const coverLetterMentionsCompany = companyMentioned(input.companyName, normalizedCoverLetter);
  const coverLetterMentionsRole = normalizedCoverLetter.includes(normalize(input.jobTitle));
  const coverLetterAvoidsGenericOpening = !GENERIC_OPENINGS.some((opening) => normalizedCoverLetter.startsWith(opening));
  const coverLetterAvoidsTemplateLanguage = templatePhraseHits(normalizedCoverLetter) <= 1;
  const coverLetterUsesNamedResumeEvidence = usesNamedResumeEvidence(input.resumeText, normalizedCoverLetter);
  const employerQuestionsAddressed = addressesEmployerQuestions(input.jobDescription, normalizedCoverLetter);
  const strengthsGroundedRatio = groundingRatio(analysis.strengths, normalizedResumeText);
  const suggestedBulletsGroundedRatio = groundingRatio(analysis.suggestedBullets, normalizedResumeText);

  if (!hasRequiredSections) warnings.push("One or more required analysis sections are empty.");
  if (!scoreInRange) warnings.push("Match score is outside the expected 0-100 range.");
  if (!summaryAvoidsScoreText) warnings.push("Summary includes score text that should be displayed separately.");
  if (coverLetterWordCount < 180) warnings.push("Cover letter is shorter than the minimum quality threshold.");
  if (coverLetterWordCount > 380) warnings.push("Cover letter is longer than the target range.");
  if (!bulletMetricsGrounded) warnings.push("Suggested bullets appear to include metrics not found in the resume text.");
  if (!missingKeywordsReasonable) warnings.push("Missing keyword list may be too broad for the extracted requirements.");
  if (requiredSkillCoverageRatio < 0.6) warnings.push("Required skills do not appear sufficiently grounded in the job description.");
  if (missingKeywordCoverageRatio < 0.5 && analysis.missingKeywords.length > 0) {
    warnings.push("Some missing keywords may not be clearly supported by the job description.");
  }
  if (!coverLetterMentionsCompany) warnings.push("Cover letter does not mention the company name.");
  if (!coverLetterMentionsRole) warnings.push("Cover letter does not mention the target role.");
  if (!coverLetterAvoidsGenericOpening) warnings.push("Cover letter opening sounds generic.");
  if (!coverLetterAvoidsTemplateLanguage) warnings.push("Cover letter uses template-style phrases that weaken recruiter impact.");
  if (!coverLetterUsesNamedResumeEvidence) warnings.push("Cover letter does not use enough named resume evidence, such as a project, employer, metric, or integration.");
  if (!employerQuestionsAddressed) warnings.push("Cover letter does not address employer screening-question topics supported by the resume.");
  if (strengthsGroundedRatio < 0.5) warnings.push("Strengths may not be sufficiently grounded in the resume.");
  if (suggestedBulletsGroundedRatio < 0.5) warnings.push("Suggested bullets may not be sufficiently grounded in the resume.");

  if (requiredSkillCoverageRatio < 0.8) {
    recommendations.push("Tighten required skills so they map directly to the job description.");
  }
  if (strengthsGroundedRatio < 0.8) {
    recommendations.push("Rewrite strengths to cite clearer resume evidence.");
  }
  if (suggestedBulletsGroundedRatio < 0.8) {
    recommendations.push("Make suggested bullets more directly traceable to resume projects or experience.");
  }
  if (!coverLetterMentionsCompany || !coverLetterMentionsRole) {
    recommendations.push("Personalize the cover letter opening with the company and role.");
  }
  if (coverLetterWordCount < 250 || coverLetterWordCount > 350) {
    recommendations.push("Tune cover letter length closer to the 250-350 word target.");
  }
  if (!coverLetterUsesNamedResumeEvidence) {
    recommendations.push("Add a named project, employer, metric, or integration from the resume to make the cover letter less abstract.");
  }
  if (!employerQuestionsAddressed) {
    recommendations.push("Where the JD lists employer questions, weave in supported answers such as RDBMS, JavaScript, full-stack, or framework experience.");
  }

  const categoryScores = {
    structure: average([scoreBoolean(hasRequiredSections), scoreBoolean(scoreInRange), scoreBoolean(summaryAvoidsScoreText)]),
    jobAlignment: average([requiredSkillCoverageRatio * 100, coverLetterMentionsRole ? 100 : 60]),
    resumeGrounding: average([strengthsGroundedRatio * 100, suggestedBulletsGroundedRatio * 100, bulletMetricsGrounded ? 100 : 40]),
    atsCoverage: average([missingKeywordsReasonable ? 100 : 65, missingKeywordCoverageRatio * 100]),
    coverLetterQuality: average([
      coverLetterLengthScore(coverLetterWordCount),
      coverLetterMentionsCompany ? 100 : 60,
      coverLetterAvoidsGenericOpening ? 100 : 60,
      coverLetterAvoidsTemplateLanguage ? 100 : 60,
      coverLetterUsesNamedResumeEvidence ? 100 : 65,
      employerQuestionsAddressed ? 100 : 75
    ])
  };
  const qualityScore = Math.round(average(Object.values(categoryScores)));

  return {
    qualityScore,
    passed:
      qualityScore >= 75 &&
      warnings.filter((warning) => !warning.includes("target range")).length <= 2 &&
      coverLetterAvoidsTemplateLanguage &&
      coverLetterUsesNamedResumeEvidence &&
      employerQuestionsAddressed,
    warnings,
    recommendations,
    categoryScores,
    checks: {
      coverLetterWordCount,
      hasRequiredSections,
      scoreInRange,
      summaryAvoidsScoreText,
      bulletMetricsGrounded,
      missingKeywordsReasonable,
      requiredSkillCoverageRatio,
      missingKeywordCoverageRatio,
      coverLetterMentionsCompany,
      coverLetterMentionsRole,
      coverLetterAvoidsGenericOpening,
      coverLetterAvoidsTemplateLanguage,
      coverLetterUsesNamedResumeEvidence,
      employerQuestionsAddressed,
      strengthsGroundedRatio,
      suggestedBulletsGroundedRatio
    }
  };
}

function metricsAppearGrounded(resumeText: string, bullets: string[]) {
  const resumeHasMetrics = METRIC_PATTERN.test(resumeText);
  const bulletsHaveMetrics = bullets.some((bullet) => METRIC_PATTERN.test(bullet));

  return !bulletsHaveMetrics || resumeHasMetrics;
}

function companyMentioned(companyName: string, normalizedCoverLetter: string) {
  const normalizedCompany = normalize(companyName);
  if (normalizedCoverLetter.includes(normalizedCompany)) return true;

  const coreCompanyName = normalizedCompany
    .replace(/\b(pty|limited|ltd|inc|llc|plc|company|co)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return coreCompanyName.length >= 3 && normalizedCoverLetter.includes(coreCompanyName);
}

function templatePhraseHits(coverLetter: string) {
  return TEMPLATE_PHRASES.filter((phrase) => coverLetter.includes(phrase)).length;
}

function usesNamedResumeEvidence(resumeText: string, normalizedCoverLetter: string) {
  const anchors = extractNamedResumeAnchors(resumeText);
  if (anchors.length === 0) return true;

  return anchors.some((anchor) => normalizedCoverLetter.includes(normalize(anchor)));
}

function extractNamedResumeAnchors(resumeText: string) {
  const ignoredHeadings = new Set([
    "profile",
    "education",
    "experience",
    "projects",
    "technical skills",
    "certifications"
  ]);

  return resumeText
    .split(/\n+/)
    .map((line) => line.replace(/\[[^\]]+\]/g, "").replace(/\s{2,}.*/, "").trim())
    .filter((line) => line.length >= 4 && line.length <= 70)
    .filter((line) => !ignoredHeadings.has(line.toLowerCase()))
    .filter((line) => !/[@|]/.test(line))
    .filter((line) => /[A-Z][a-z]+|[A-Z]{2,}|[a-z]+[A-Z][a-z]+/.test(line))
    .filter((line) => !/^(languages|databases|devops|libraries)\b/i.test(line))
    .slice(0, 12);
}

function addressesEmployerQuestions(jobDescription: string, normalizedCoverLetter: string) {
  if (!/employer questions|your application will include|following questions/i.test(jobDescription)) {
    return true;
  }

  const screeningTopics = [
    "rdbms",
    "relational database",
    "javascript",
    "full-stack",
    "full stack",
    "front-end",
    "frontend",
    "framework",
    "right to work",
    "australia"
  ];

  return screeningTopics.filter((topic) => normalizedCoverLetter.includes(topic)).length >= 2;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function coverageRatio(items: string[], targetText: string) {
  if (items.length === 0) return 0;

  const covered = items.filter((item) => phraseAppears(item, targetText)).length;
  return roundRatio(covered / items.length);
}

function groundingRatio(items: string[], resumeText: string) {
  if (items.length === 0) return 0;

  const grounded = items.filter((item) => hasMeaningfulOverlap(item, resumeText)).length;
  return roundRatio(grounded / items.length);
}

function phraseAppears(value: string, targetText: string) {
  const normalized = normalize(value);
  if (!normalized) return false;
  if (targetText.includes(normalized)) return true;

  const tokens = meaningfulTokens(normalized);
  return tokens.length > 0 && tokens.some((token) => targetText.includes(token));
}

function hasMeaningfulOverlap(value: string, resumeText: string) {
  const tokens = meaningfulTokens(normalize(value));
  if (tokens.length === 0) return false;

  const hits = tokens.filter((token) => resumeText.includes(token)).length;
  return hits / tokens.length >= 0.35;
}

function meaningfulTokens(value: string) {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2)
    .filter((token) => !["and", "the", "with", "using", "for", "from", "into", "that", "this"].includes(token));
}

function scoreBoolean(value: boolean) {
  return value ? 100 : 40;
}

function coverLetterLengthScore(wordCount: number) {
  if (wordCount >= 250 && wordCount <= 350) return 100;
  if (wordCount >= 180 && wordCount <= 380) return 80;
  return 45;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function roundRatio(value: number) {
  return Math.round(value * 100) / 100;
}
