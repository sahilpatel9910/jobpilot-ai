export type InputClassification = "resume" | "job_description" | "invalid" | "unknown";

export type RiskLevel = "low" | "medium" | "high";

export type InputValidationResult = {
  isValid: boolean;
  sanitizedResumeText: string;
  sanitizedJobDescription: string;
  resumeClassification: InputClassification;
  jobDescriptionClassification: InputClassification;
  riskLevel: RiskLevel;
  errors: string[];
  warnings: string[];
  detectedIssues: string[];
};

export type PromptInjectionFinding = {
  field: "resume" | "jobDescription";
  riskScore: number;
  riskLevel: RiskLevel;
  issues: string[];
};

