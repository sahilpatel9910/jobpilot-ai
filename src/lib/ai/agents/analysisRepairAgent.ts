import type { QualityReviewResult } from "@/lib/ai/agents/qualityReviewAgent";
import type { LlmProviderName } from "@/lib/ai/llmClient";
import type { JobAnalysis, JobIntakeInput } from "@/lib/db/types";
import { repairAnalysisWithLlm } from "@/lib/ai/llmClient";

export type AnalysisRepairResult = {
  analysis: JobAnalysis;
  repairedBy: LlmProviderName;
  attemptedWarnings: string[];
  attemptedRecommendations: string[];
};

export async function analysisRepairAgent({
  input,
  analysis,
  review,
  provider
}: {
  input: JobIntakeInput;
  analysis: JobAnalysis;
  review: QualityReviewResult;
  provider: LlmProviderName;
}): Promise<AnalysisRepairResult> {
  // Agent workflow decision point: repair is deliberately limited to one pass
  // so quality failures are corrected without hiding repeated LLM drift.
  const repairedAnalysis = await repairAnalysisWithLlm({
    input,
    analysis,
    review,
    provider
  });

  return {
    analysis: repairedAnalysis,
    repairedBy: provider,
    attemptedWarnings: review.warnings,
    attemptedRecommendations: review.recommendations
  };
}
