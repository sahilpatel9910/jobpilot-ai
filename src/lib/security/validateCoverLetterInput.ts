import { sanitizeSingleLineField, sanitizeTextField } from "@/lib/security/inputSanitizer";
import { combineRiskLevels, detectPromptInjection } from "@/lib/security/promptInjectionDetector";

const MAX_CONTEXT_CHARACTERS = 2500;
const MAX_REVISION_CHARACTERS = 1000;

export type CoverLetterInputValidation = {
  isValid: boolean;
  context: string;
  revisionInstruction: string;
  errors: string[];
  warnings: string[];
  detectedIssues: string[];
  riskLevel: "low" | "medium" | "high";
};

export function validateCoverLetterInput({
  context,
  revisionInstruction,
  requireRevisionInstruction = false
}: {
  context?: unknown;
  revisionInstruction?: unknown;
  requireRevisionInstruction?: boolean;
}): CoverLetterInputValidation {
  const sanitizedContext = sanitizeTextField(context, MAX_CONTEXT_CHARACTERS);
  const sanitizedRevision = sanitizeSingleLineField(revisionInstruction, MAX_REVISION_CHARACTERS);
  const errors: string[] = [];
  const warnings: string[] = [];
  const detectedIssues: string[] = [];

  if (sanitizedContext.lengthExceeded) {
    errors.push("Context is too long. Please keep it under 2,500 characters.");
  }

  if (sanitizedRevision.lengthExceeded) {
    errors.push("Revision instruction is too long. Please keep it under 1,000 characters.");
  }

  if (requireRevisionInstruction && !sanitizedRevision.value) {
    errors.push("Please add a revision instruction before regenerating the cover letter.");
  }

  if (sanitizedContext.removedMarkup || sanitizedRevision.removedMarkup) {
    warnings.push("Some pasted formatting was removed before generating the cover letter.");
    detectedIssues.push("HTML/script tags removed from cover letter context.");
  }

  const contextInjection = detectPromptInjection("resume", sanitizedContext.value);
  const revisionInjection = detectPromptInjection("jobDescription", sanitizedRevision.value);
  const riskLevel = combineRiskLevels([contextInjection.riskLevel, revisionInjection.riskLevel]);

  for (const finding of [contextInjection, revisionInjection]) {
    if (finding.riskLevel === "high") {
      errors.push("The cover letter instructions include unsafe prompt-like wording. Please rewrite them as plain context.");
    } else if (finding.riskLevel === "medium") {
      warnings.push("The cover letter instructions contain unusual wording. They will be treated only as user context.");
    }

    detectedIssues.push(...finding.issues);
  }

  return {
    isValid: errors.length === 0 && riskLevel !== "high",
    context: sanitizedContext.value,
    revisionInstruction: sanitizedRevision.value,
    errors: unique(errors),
    warnings: unique(warnings),
    detectedIssues: unique(detectedIssues),
    riskLevel
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
