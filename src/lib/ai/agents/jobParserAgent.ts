import type { JobIntakeInput } from "@/lib/db/types";

export type ParsedJob = {
  normalizedCompanyName: string;
  normalizedJobTitle: string;
  descriptionWordCount: number;
  detectedSeniority: "Intern" | "Junior" | "Mid" | "Senior" | "Lead" | "Unspecified";
};

export function jobParserAgent(input: JobIntakeInput): ParsedJob {
  const description = input.jobDescription.toLowerCase();
  const seniority =
    description.includes("lead") || description.includes("principal")
      ? "Lead"
      : description.includes("senior")
        ? "Senior"
        : description.includes("mid")
          ? "Mid"
          : description.includes("junior") || description.includes("graduate")
            ? "Junior"
            : description.includes("intern")
              ? "Intern"
              : "Unspecified";

  return {
    normalizedCompanyName: input.companyName.trim(),
    normalizedJobTitle: input.jobTitle.trim(),
    descriptionWordCount: input.jobDescription.trim().split(/\s+/).filter(Boolean).length,
    detectedSeniority: seniority
  };
}
