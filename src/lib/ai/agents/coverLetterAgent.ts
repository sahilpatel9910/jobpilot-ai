import type { JobAnalysis } from "@/lib/db/types";

export function coverLetterAgent(analysis: JobAnalysis) {
  return normalizeCoverLetterLength(analysis.coverLetter);
}

function normalizeCoverLetterLength(letter: string) {
  const words = letter.trim().split(/\s+/);
  if (words.length <= 360) {
    return letter.trim();
  }

  return `${words.slice(0, 350).join(" ")}.`;
}
