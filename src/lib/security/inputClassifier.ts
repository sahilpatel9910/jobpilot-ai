import type { InputClassification } from "@/lib/security/types";

export type ClassificationResult = {
  classification: InputClassification;
  resumeScore: number;
  jobDescriptionScore: number;
  issues: string[];
  jobAdSignals: {
    hiringIntent: boolean;
    responsibilities: boolean;
    requirements: boolean;
    roleContext: boolean;
    organizationContext: boolean;
    locationOrEmployment: boolean;
    domainSkill: boolean;
    softSkill: boolean;
    structureScore: number;
  };
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
  /\b(portfolio|certification|university|bachelor|master|degree)\b/i
];

const JOB_SECTION_PATTERNS = [
  /\b(about the role|about this role|what you'?ll do|responsibilities|duties|key responsibilities)\b/i,
  /\b(who we'?re looking for|about you|selection criteria|requirements|qualifications|skills and experience)\b/i,
  /\b(we are looking|we'?re looking|join us|join our team|we'?re hiring|the successful candidate|ideal candidate)\b/i,
  /\b(full[- ]time|part[- ]time|contract|casual|graduate|senior|junior|hybrid|remote|onsite|salary|location)\b/i,
  /\b(apply|hiring|recruiting|benefits|equal opportunity|career opportunity)\b/i
];

const JOB_ROLE_PATTERNS = [
  /\b(role|position|team|company|studio|practice|organisation|organization|business|client|customer|project)\b/i,
  /\b(collaborate|partner with|work closely|responsible for|support|assist|coordinate|manage|prepare|deliver)\b/i,
  /\b(experience with|proficiency in|knowledge of|familiarity with|understanding of|ability to|must have|required)\b/i,
  /\b(communication|teamwork|attention to detail|problem solving|time management|stakeholder|client-facing)\b/i
];

const HIRING_INTENT_PATTERNS = [
  /\b(we are looking for|we'?re looking for|join us|join our team|we'?re hiring|is seeking|are seeking|opportunity for|career opportunity)\b/i,
  /\b(apply now|applications? close|the successful candidate|ideal candidate)\b/i
];

const RESPONSIBILITY_PATTERNS = [
  /\b(what you'?ll do|responsibilities|duties|key responsibilities|day[- ]to[- ]day|you will|you'?ll|your role will)\b/i,
  /\b(responsible for|support|assist|prepare|coordinate|manage|deliver|develop|design|maintain|provide|work on)\b/i
];

const REQUIREMENT_PATTERNS = [
  /\b(who we'?re looking for|about you|requirements|selection criteria|qualifications|skills and experience|essential criteria)\b/i,
  /\b(required|preferred|must have|you will need|experience in|experience with|proven experience|qualification|licen[cs]e|certification)\b/i
];

const ROLE_CONTEXT_PATTERNS = [
  /\b(architect|architecture|designer|technician|manager|assistant|coordinator|consultant|developer|engineer|nurse|teacher|chef|barista|retail|sales|graduate|senior|junior)\b/i,
  /\b(role|position|vacancy|opportunity)\b/i
];

const ORGANIZATION_CONTEXT_PATTERNS = [
  /\b(company|studio|practice|firm|agency|organisation|organization|business|team|client|customer|project|portfolio)\b/i
];

const LOCATION_OR_EMPLOYMENT_PATTERNS = [
  /\b(melbourne|sydney|brisbane|perth|adelaide|australia|regional|cbd|remote|hybrid|onsite|full[- ]time|part[- ]time|casual|contract)\b/i
];

const DOMAIN_SKILL_PATTERNS = [
  /\b(autocad|revit|sketchup|adobe|building code|construction|documentation|hospitality|customer service|pos|inventory|healthcare|aged care|finance|compliance|marketing|teaching|curriculum|licen[cs]e|certification|degree|diploma)\b/i,
  /\b(standards|regulations|stakeholder|vendor|supplier|project delivery|site|briefs|drawings|documentation)\b/i
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
      issues: ["Input is too short to classify."],
      jobAdSignals: getJobAdSignals("")
    };
  }

  if (uniqueRatio < 0.28 || hasLowInformationPattern(text)) {
    return {
      classification: "invalid",
      resumeScore: 0,
      jobDescriptionScore: 0,
      issues: ["Input appears to be low-information or repeated text."],
      jobAdSignals: getJobAdSignals(text)
    };
  }

  const jobAdSignals = getJobAdSignals(text);
  const resumeScore = scorePatterns(text, RESUME_SECTION_PATTERNS, 2) + scorePatterns(text, RESUME_ROLE_PATTERNS, 1);
  const jobDescriptionScore =
    scorePatterns(text, JOB_SECTION_PATTERNS, 2) + scorePatterns(text, JOB_ROLE_PATTERNS, 1) + jobAdSignals.structureScore;

  if (wordCount >= 45 && hasStrongJobAdStructure(jobAdSignals)) {
    return { classification: "job_description", resumeScore, jobDescriptionScore, issues, jobAdSignals };
  }

  if (resumeScore < 3 && jobDescriptionScore < 3) {
    issues.push("Input does not contain enough resume or job description signals.");
    return { classification: "unknown", resumeScore, jobDescriptionScore, issues, jobAdSignals };
  }

  if (resumeScore >= jobDescriptionScore + 2 && resumeScore >= 3) {
    return { classification: "resume", resumeScore, jobDescriptionScore, issues, jobAdSignals };
  }

  if (
    jobDescriptionScore >= resumeScore + 2 &&
    jobDescriptionScore >= 4 &&
    (jobAdSignals.hiringIntent || jobAdSignals.responsibilities || jobAdSignals.requirements)
  ) {
    return { classification: "job_description", resumeScore, jobDescriptionScore, issues, jobAdSignals };
  }

  if (resumeScore >= 4 && jobDescriptionScore >= 4) {
    issues.push("Input contains both resume and job description signals.");
    return { classification: "unknown", resumeScore, jobDescriptionScore, issues, jobAdSignals };
  }

  return { classification: "unknown", resumeScore, jobDescriptionScore, issues, jobAdSignals };
}

export function hasStrongJobAdStructure(signals: ClassificationResult["jobAdSignals"]) {
  return signals.hiringIntent && (signals.responsibilities || signals.requirements) && signals.structureScore >= 5;
}

export function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function scorePatterns(value: string, patterns: RegExp[], weight: number) {
  return patterns.reduce((score, pattern) => score + (pattern.test(value) ? weight : 0), 0);
}

function getJobAdSignals(value: string): ClassificationResult["jobAdSignals"] {
  const hiringIntent = HIRING_INTENT_PATTERNS.some((pattern) => pattern.test(value));
  const responsibilities = RESPONSIBILITY_PATTERNS.some((pattern) => pattern.test(value));
  const requirements = REQUIREMENT_PATTERNS.some((pattern) => pattern.test(value));
  const roleContext = ROLE_CONTEXT_PATTERNS.some((pattern) => pattern.test(value));
  const organizationContext = ORGANIZATION_CONTEXT_PATTERNS.some((pattern) => pattern.test(value));
  const locationOrEmployment = LOCATION_OR_EMPLOYMENT_PATTERNS.some((pattern) => pattern.test(value));
  const domainSkill = DOMAIN_SKILL_PATTERNS.some((pattern) => pattern.test(value));
  const softSkill = JOB_ROLE_PATTERNS[3].test(value);
  const structureScore = [
    hiringIntent,
    responsibilities,
    requirements,
    roleContext,
    organizationContext,
    locationOrEmployment,
    domainSkill,
    softSkill
  ].filter(Boolean).length;

  return {
    hiringIntent,
    responsibilities,
    requirements,
    roleContext,
    organizationContext,
    locationOrEmployment,
    domainSkill,
    softSkill,
    structureScore
  };
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
