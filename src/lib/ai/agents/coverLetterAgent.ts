import type { JobAnalysis, JobIntakeInput } from "@/lib/db/types";
import { generateCoverLetterWithLlm } from "@/lib/ai/llmClient";

export type CoverLetterGenerationInput = {
  input: JobIntakeInput;
  analysis: JobAnalysis;
  context?: string;
  profileSummary?: string;
  coverLetterPreferences?: string;
  previousCoverLetter?: string;
  revisionInstruction?: string;
};

export async function coverLetterAgent({
  input,
  analysis,
  context,
  profileSummary,
  coverLetterPreferences,
  previousCoverLetter,
  revisionInstruction
}: CoverLetterGenerationInput) {
  return generateCoverLetterWithLlm({
    input,
    analysis,
    context,
    profileSummary,
    coverLetterPreferences,
    previousCoverLetter,
    revisionInstruction
  });
}
