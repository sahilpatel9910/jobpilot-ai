export const APPLICATION_STATUSES = [
  "Saved",
  "Analysed",
  "Applied",
  "Interview",
  "Rejected",
  "Offer"
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type JobIntakeInput = {
  companyName: string;
  jobTitle: string;
  jobUrl?: string;
  jobDescription: string;
  resumeText: string;
};

export type JobAnalysis = {
  summary: string;
  requiredSkills: string[];
  matchScore: number;
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  suggestedBullets: string[];
  coverLetter: string;
};

export type ApplicationRecord = {
  id: string;
  company_name: string;
  job_title: string;
  job_url: string | null;
  job_description: string;
  resume_text: string;
  status: ApplicationStatus;
  match_score: number | null;
  summary: string | null;
  required_skills: string[];
  strengths: string[];
  gaps: string[];
  missing_keywords: string[];
  suggested_bullets: string[];
  cover_letter: string | null;
  created_at: string;
  updated_at: string;
};

export type AnalyseJobResponse = {
  application: ApplicationRecord | null;
  analysis: JobAnalysis;
  mode: "mock" | "llm";
  persistence: "saved" | "skipped" | "failed";
  persistenceError?: string;
};
