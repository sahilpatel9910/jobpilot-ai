import type { AnalyseJobResponse, JobAnalysis, JobIntakeInput } from "@/lib/db/types";
import { applicationTrackerAgent } from "@/lib/ai/agents/applicationTrackerAgent";
import { atsKeywordAgent } from "@/lib/ai/agents/atsKeywordAgent";
import { coverLetterAgent } from "@/lib/ai/agents/coverLetterAgent";
import { jobParserAgent } from "@/lib/ai/agents/jobParserAgent";
import { resumeMatcherAgent } from "@/lib/ai/agents/resumeMatcherAgent";
import { generateAnalysisWithLlm } from "@/lib/ai/llmClient";

export async function runJobAnalysisWorkflow(input: JobIntakeInput): Promise<AnalyseJobResponse> {
  const parsedJob = jobParserAgent(input);
  const normalizedInput = {
    ...input,
    companyName: parsedJob.normalizedCompanyName,
    jobTitle: parsedJob.normalizedJobTitle
  };

  const { analysis: baseAnalysis, mode } = await generateAnalysisWithLlm(normalizedInput);

  // Agent workflow decision point: each step owns one concern so LangGraph nodes
  // can replace these direct function calls later without changing UI contracts.
  const ats = atsKeywordAgent(normalizedInput, baseAnalysis);
  const matcher = resumeMatcherAgent(normalizedInput, baseAnalysis);
  const coverLetter = coverLetterAgent(baseAnalysis);

  const analysis: JobAnalysis = {
    ...baseAnalysis,
    ...ats,
    ...matcher,
    coverLetter
  };

  const persistence = await applicationTrackerAgent(normalizedInput, analysis);

  return {
    analysis,
    mode,
    ...persistence
  };
}
