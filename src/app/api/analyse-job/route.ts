import { NextResponse } from "next/server";
import { runJobAnalysisWorkflow } from "@/lib/ai/workflows/jobAnalysisWorkflow";
import type { JobIntakeInput } from "@/lib/db/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<JobIntakeInput>;
  const validationError = validateInput(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const response = await runJobAnalysisWorkflow(body as JobIntakeInput);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to analyse job" },
      { status: 500 }
    );
  }
}

function validateInput(body: Partial<JobIntakeInput>) {
  if (!body.companyName?.trim()) return "Company name is required.";
  if (!body.jobTitle?.trim()) return "Job title is required.";
  if (!body.jobDescription?.trim()) return "Job description is required.";
  if (!body.resumeText?.trim()) return "Resume text is required.";
  return null;
}
