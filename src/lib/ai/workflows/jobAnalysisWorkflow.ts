import { runJobAnalysisGraph } from "@/lib/ai/workflows/jobAnalysisGraph";
import type { AnalyseJobResponse, JobIntakeInput } from "@/lib/db/types";
import type { InputValidationResult } from "@/lib/security/types";

export async function runJobAnalysisWorkflow(
  input: JobIntakeInput,
  validationResult: InputValidationResult | undefined,
  userId: string
): Promise<AnalyseJobResponse> {
  return runJobAnalysisGraph({ input, validationResult, userId });
}
