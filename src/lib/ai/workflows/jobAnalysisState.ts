import type { AgentTraceEntry } from "@/lib/ai/agentTrace";
import type { AnalysisRepairResult } from "@/lib/ai/agents/analysisRepairAgent";
import type { AtsKeywordResult } from "@/lib/ai/agents/atsKeywordAgent";
import type { ParsedJob } from "@/lib/ai/agents/jobParserAgent";
import type { QualityReviewResult } from "@/lib/ai/agents/qualityReviewAgent";
import type { ResumeMatchResult } from "@/lib/ai/agents/resumeMatcherAgent";
import type { LlmProviderName } from "@/lib/ai/llmClient";
import type { AnalyseJobResponse, JobAnalysis, JobIntakeInput } from "@/lib/db/types";
import type { InputValidationResult } from "@/lib/security/types";

export type AnalysisMode = "mock" | "llm";
export type AnalysisProvider = LlmProviderName | "mock";
export type PersistenceResult = Pick<AnalyseJobResponse, "application" | "persistence" | "persistenceError">;

export type JobAnalysisWorkflowState = {
  input: JobIntakeInput;
  userId: string;
  validationResult?: InputValidationResult;
  parsedJob?: ParsedJob;
  normalizedInput?: JobIntakeInput;
  baseAnalysis?: JobAnalysis;
  ats?: AtsKeywordResult;
  matcher?: ResumeMatchResult;
  analysis?: JobAnalysis;
  qualityReview?: QualityReviewResult;
  repair?: AnalysisRepairResult;
  mode?: AnalysisMode;
  provider?: AnalysisProvider;
  persistence?: PersistenceResult;
  traces: AgentTraceEntry[];
};
