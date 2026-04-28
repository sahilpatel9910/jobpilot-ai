export const APPLICATION_STATUSES = [
  "Saved",
  "Analysed",
  "Applied",
  "Interview",
  "Rejected",
  "Offer",
  "Archived"
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

export type CoverLetterStatus = "not_generated" | "generated" | "regenerated";

export type ApplicationRecord = {
  id: string;
  user_id: string;
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
  cover_letter_context: string | null;
  cover_letter_revision_instruction: string | null;
  cover_letter_generated_at: string | null;
  cover_letter_status: CoverLetterStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileSettingsRecord = {
  id: string;
  user_id: string;
  resume_text: string;
  created_at: string;
  updated_at: string;
};

export type ApplicationStatusHistoryRecord = {
  id: string;
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  note: string | null;
  created_at: string;
};

export type AgentRunStatus = "completed" | "failed";

export type AgentRunRecord = {
  id: string;
  application_id: string;
  agent_name: string;
  input_summary: string | null;
  output: Record<string, unknown>;
  status: AgentRunStatus;
  started_at: string;
  completed_at: string | null;
};

export type AnalyseJobResponse = {
  application: ApplicationRecord | null;
  analysis: JobAnalysis;
  mode: "mock" | "llm";
  llmProvider?: string;
  persistence: "saved" | "skipped" | "failed";
  persistenceError?: string;
};
