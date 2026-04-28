import type { InputClassification } from "@/lib/security/types";

export type ClassificationResult = {
  classification: InputClassification;
  resumeScore: number;
  jobDescriptionScore: number;
  issues: string[];
};

const RESUME_SECTION_PATTERNS = [
  /\b(summary|profile|objective)\b/i,
  /\b(skills|technical skills|technologies|tooling)\b/i,
  /\b(projects?|portfolio)\b/i,
  /\b(experience|employment|work history|professional experience)\b/i,
  /\b(education|degree|university|certifications?)\b/i
];

const RESUME_ROLE_PATTERNS = [
  /\b(engineer|developer|analyst|designer|manager|consultant|intern|graduate|specialist)\b/i,
  /\b(built|created|implemented|developed|designed|delivered|improved|maintained|led|managed)\b/i,
  /\b(github|linkedin|portfolio|email|phone)\b/i,
  /\b(react|next\.?js|typescript|javascript|python|java|sql|postgres|supabase|aws|azure|docker)\b/i
];

const JOB_SECTION_PATTERNS = [
  /\b(about the role|about this role|what you'?ll do|responsibilities|requirements|qualifications)\b/i,
  /\b(we are looking|we'?re looking|you will|you'?ll|the successful candidate|ideal candidate)\b/i,
  /\b(full[- ]time|part[- ]time|contract|hybrid|remote|onsite|salary|location)\b/i,
  /\b(apply|hiring|recruiting|join our team|benefits|equal opportunity)\b/i,
  /\b(required|preferred|nice to have|must have|minimum qualifications)\b/i
];

const JOB_ROLE_PATTERNS = [
  /\b(role|position|team|company|organisation|organization)\b/i,
  /\b(collaborate|partner with|work closely|responsible for|own and deliver)\b/i,
  /\b(experience with|proficiency in|strong knowledge|familiarity with)\b/i,
  /\b(react|next\.?js|typescript|javascript|python|java|sql|postgres|supabase|aws|azure|docker)\b/i
];

export function classifyInputText(value: string): ClassificationResult {
  const text = value.trim();
  const issues: string[] = [];
  const wordCount = countWords(text);
  const uniqueRatio = uniqueWordRatio(text);

  if (!text || wordCount < 12) {
    return {
      classification: "invalid",
      resumeScore: 0,
      jobDescriptionScore: 0,
      issues: ["Input is too short to classify."]
    };
  }

  if (uniqueRatio < 0.28 || hasLowInformationPattern(text)) {
    return {
      classification: "invalid",
      resumeScore: 0,
      jobDescriptionScore: 0,
      issues: ["Input appears to be low-information or repeated text."]
    };
  }

  const resumeScore = scorePatterns(text, RESUME_SECTION_PATTERNS, 2) + scorePatterns(text, RESUME_ROLE_PATTERNS, 1);
  const jobDescriptionScore = scorePatterns(text, JOB_SECTION_PATTERNS, 2) + scorePatterns(text, JOB_ROLE_PATTERNS, 1);

  if (resumeScore < 3 && jobDescriptionScore < 3) {
    issues.push("Input does not contain enough resume or job description signals.");
    return { classification: "unknown", resumeScore, jobDescriptionScore, issues };
  }

  if (resumeScore >= jobDescriptionScore + 2 && resumeScore >= 3) {
    return { classification: "resume", resumeScore, jobDescriptionScore, issues };
  }

  if (jobDescriptionScore >= resumeScore + 2 && jobDescriptionScore >= 3) {
    return { classification: "job_description", resumeScore, jobDescriptionScore, issues };
  }

  if (resumeScore >= 4 && jobDescriptionScore >= 4) {
    issues.push("Input contains both resume and job description signals.");
    return { classification: "unknown", resumeScore, jobDescriptionScore, issues };
  }

  return { classification: "unknown", resumeScore, jobDescriptionScore, issues };
}

export function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function scorePatterns(value: string, patterns: RegExp[], weight: number) {
  return patterns.reduce((score, pattern) => score + (pattern.test(value) ? weight : 0), 0);
}

function uniqueWordRatio(value: string) {
  const words = value
    .toLowerCase()
    .split(/\W+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);

  if (words.length === 0) return 0;
  return new Set(words).size / words.length;
}

function hasLowInformationPattern(value: string) {
  const meaningfulText = value
    .split(/\n+/)
    .filter((line) => (line.match(/[\p{L}\p{N}]/gu) || []).length >= 3)
    .join(" ");
  const compact = meaningfulText.replace(/\s+/g, "");
  if (/(.)\1{18,}/.test(compact)) return true;

  const alphaNumeric = compact.replace(/[^\p{L}\p{N}]/gu, "");
  if (alphaNumeric.length < 25) return true;

  // Formatted resumes often contain long decorative separators. Do not reject
  // otherwise meaningful text because of copied PDF/word-processor dividers.
  const formattingTolerantLength = compact.replace(/[^\p{L}\p{N}@.+#/-]/gu, "").length;
  return formattingTolerantLength > 0 && alphaNumeric.length / formattingTolerantLength < 0.35;
}
