import type { JobIntakeInput } from "@/lib/db/types";
import { classifyInputText, countWords, hasStrongJobAdStructure } from "@/lib/security/inputClassifier";
import {
  MAX_COMPANY_CHARACTERS,
  MAX_JOB_DESCRIPTION_CHARACTERS,
  MAX_RESUME_CHARACTERS,
  MAX_TITLE_CHARACTERS,
  MAX_URL_CHARACTERS,
  sanitizeSingleLineField,
  sanitizeTextField
} from "@/lib/security/inputSanitizer";
import { combineRiskLevels, detectPromptInjection } from "@/lib/security/promptInjectionDetector";
import type { InputValidationResult } from "@/lib/security/types";

const MIN_RESUME_WORDS = 40;
const MIN_JOB_DESCRIPTION_WORDS = 45;

export type AnalysisInputValidation = {
  result: InputValidationResult;
  sanitizedInput: JobIntakeInput;
};

export function validateAnalysisInput(input: Partial<JobIntakeInput>): AnalysisInputValidation {
  const companyName = sanitizeSingleLineField(input.companyName, MAX_COMPANY_CHARACTERS);
  const jobTitle = sanitizeSingleLineField(input.jobTitle, MAX_TITLE_CHARACTERS);
  const jobUrl = sanitizeSingleLineField(input.jobUrl, MAX_URL_CHARACTERS);
  const resumeText = sanitizeTextField(input.resumeText, MAX_RESUME_CHARACTERS);
  const jobDescription = sanitizeTextField(input.jobDescription, MAX_JOB_DESCRIPTION_CHARACTERS);

  const errors: string[] = [];
  const warnings: string[] = [];
  const detectedIssues: string[] = [];

  if (!companyName.value) errors.push("Company name is required.");
  if (!jobTitle.value) errors.push("Job title is required.");
  if (!jobDescription.value) errors.push("Job description is required.");
  if (!resumeText.value) errors.push("Resume text is required.");

  if (companyName.lengthExceeded) errors.push("Company name is too long.");
  if (jobTitle.lengthExceeded) errors.push("Job title is too long.");
  if (jobUrl.lengthExceeded) errors.push("Job URL is too long.");
  if (resumeText.lengthExceeded) errors.push("Resume text is too long. Please keep it under 30,000 characters.");
  if (jobDescription.lengthExceeded) {
    errors.push("Job description is too long. Please keep it under 30,000 characters.");
  }

  if (resumeText.removedMarkup || jobDescription.removedMarkup) {
    warnings.push("Some pasted HTML or script-like formatting was removed before analysis.");
    detectedIssues.push("HTML/script tags removed.");
  }

  const resumeWordCount = countWords(resumeText.value);
  const jobDescriptionWordCount = countWords(jobDescription.value);

  if (resumeText.value && resumeWordCount < MIN_RESUME_WORDS) {
    errors.push("This does not look like a complete resume. Please paste your resume with skills, projects, experience, or education.");
    detectedIssues.push("Resume text is too short.");
  }

  if (jobDescription.value && jobDescriptionWordCount < MIN_JOB_DESCRIPTION_WORDS) {
    errors.push("This does not look like a complete job description. Please paste the full job ad, including responsibilities and requirements.");
    detectedIssues.push("Job description is too short.");
  }

  const resumeClassification = classifyInputText(resumeText.value);
  const jobDescriptionClassification = classifyInputText(jobDescription.value);

  detectedIssues.push(...resumeClassification.issues.map((issue) => `Resume: ${issue}`));
  detectedIssues.push(...jobDescriptionClassification.issues.map((issue) => `Job description: ${issue}`));

  const swappedInputs =
    resumeClassification.classification === "job_description" &&
    jobDescriptionClassification.classification === "resume";

  if (swappedInputs) {
    errors.unshift(
      "It looks like the resume and job description may be swapped. Please place your resume in the resume field and the job description in the job description field."
    );
    detectedIssues.push("Resume and job description appear swapped.");
  } else {
    if (
      resumeText.value &&
      resumeWordCount >= MIN_RESUME_WORDS &&
      !["resume", "unknown"].includes(resumeClassification.classification)
    ) {
      errors.push("This does not look like a resume. Please paste your resume in the resume field.");
    }

    if (
      jobDescription.value &&
      jobDescriptionWordCount >= MIN_JOB_DESCRIPTION_WORDS &&
      !["job_description", "unknown"].includes(jobDescriptionClassification.classification)
    ) {
      errors.push("This does not look like a job description. Please paste the full job ad, including responsibilities and requirements.");
    }

    if (
      resumeText.value &&
      resumeWordCount >= MIN_RESUME_WORDS &&
      resumeClassification.classification === "unknown" &&
      resumeClassification.resumeScore < 3
    ) {
      errors.push("This does not look like a resume. Please paste your resume with skills, projects, experience, or education.");
    } else if (resumeText.value && resumeWordCount >= MIN_RESUME_WORDS && resumeClassification.classification === "unknown") {
      warnings.push("Resume text was accepted, but it does not contain many clear resume sections.");
      detectedIssues.push("Resume classification is uncertain.");
    }

    const allowUnknownStructuredJobAd =
      jobDescription.value &&
      jobDescriptionWordCount >= MIN_JOB_DESCRIPTION_WORDS &&
      jobDescriptionClassification.classification === "unknown" &&
      hasStrongJobAdStructure(jobDescriptionClassification.jobAdSignals);

    if (allowUnknownStructuredJobAd) {
      warnings.push("Job description was accepted based on job-ad structure, even though the classifier was uncertain.");
      detectedIssues.push("Job description classification is uncertain but has strong job-ad structure.");
    } else if (
      jobDescription.value &&
      jobDescriptionWordCount >= MIN_JOB_DESCRIPTION_WORDS &&
      jobDescriptionClassification.classification === "unknown" &&
      (jobDescriptionClassification.jobDescriptionScore < 4 ||
        !(
          jobDescriptionClassification.jobAdSignals.hiringIntent ||
          jobDescriptionClassification.jobAdSignals.responsibilities ||
          jobDescriptionClassification.jobAdSignals.requirements
        ))
    ) {
      errors.push("This does not look like a job description. Please paste the full job ad, including responsibilities and requirements.");
    } else if (
      jobDescription.value &&
      jobDescriptionWordCount >= MIN_JOB_DESCRIPTION_WORDS &&
      jobDescriptionClassification.classification === "unknown"
    ) {
      warnings.push("Job description was accepted, but it does not contain many clear job ad sections.");
      detectedIssues.push("Job description classification is uncertain.");
    }
  }

  const resumeInjection = detectPromptInjection("resume", resumeText.value);
  const jobDescriptionInjection = detectPromptInjection("jobDescription", jobDescription.value);
  const riskLevel = combineRiskLevels([resumeInjection.riskLevel, jobDescriptionInjection.riskLevel]);

  for (const finding of [resumeInjection, jobDescriptionInjection]) {
    if (finding.riskLevel === "high") {
      errors.unshift(
        finding.field === "resume"
          ? "The resume text includes instructions that appear unrelated to your resume. Please remove them and try again."
          : "The job description includes instructions that appear unrelated to the job ad. Please remove them and try again."
      );
    } else if (finding.riskLevel === "medium") {
      warnings.push(
        finding.field === "resume"
          ? "The resume text contains unusual instruction-like wording. It will be treated only as resume data."
          : "The job description contains unusual instruction-like wording. It will be treated only as job ad data."
      );
    }

    detectedIssues.push(...finding.issues.map((issue) => `${finding.field}: ${issue}`));
  }

  const sanitizedInput: JobIntakeInput = {
    companyName: companyName.value,
    jobTitle: jobTitle.value,
    jobUrl: jobUrl.value,
    jobDescription: jobDescription.value,
    resumeText: resumeText.value
  };

  return {
    sanitizedInput,
    result: {
      isValid: errors.length === 0 && riskLevel !== "high",
      sanitizedResumeText: resumeText.value,
      sanitizedJobDescription: jobDescription.value,
      resumeClassification: resumeClassification.classification,
      jobDescriptionClassification: jobDescriptionClassification.classification,
      riskLevel,
      errors: unique(errors),
      warnings: unique(warnings),
      detectedIssues: unique(detectedIssues)
    }
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
