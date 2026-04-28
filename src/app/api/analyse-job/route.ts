import { NextResponse } from "next/server";
import { toUserFacingLlmError } from "@/lib/ai/analysisValidator";
import { runJobAnalysisWorkflow } from "@/lib/ai/workflows/jobAnalysisWorkflow";
import type { JobIntakeInput } from "@/lib/db/types";
import { validateAnalysisInput } from "@/lib/security/validateAnalysisInput";
import { getCurrentUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to analyse and save jobs." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<JobIntakeInput>;
  const validation = validateAnalysisInput(body);

  if (!validation.result.isValid) {
    return NextResponse.json(
      {
        error: validation.result.errors[0] || "Please check the resume and job description before analysis.",
        errors: validation.result.errors,
        warnings: validation.result.warnings,
        validation: {
          resumeClassification: validation.result.resumeClassification,
          jobDescriptionClassification: validation.result.jobDescriptionClassification,
          riskLevel: validation.result.riskLevel,
          detectedIssues: validation.result.detectedIssues,
          ...(process.env.NODE_ENV === "development"
            ? {
                debug: {
                  sanitizedResumeLength: validation.result.sanitizedResumeText.length,
                  sanitizedJobDescriptionLength: validation.result.sanitizedJobDescription.length
                }
              }
            : {})
        }
      },
      { status: 400 }
    );
  }

  try {
    const response = await runJobAnalysisWorkflow(validation.sanitizedInput, validation.result, user.id);
    return NextResponse.json({
      ...response,
      validation: {
        warnings: validation.result.warnings,
        riskLevel: validation.result.riskLevel,
        sanitizedResumeText: validation.result.sanitizedResumeText
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: toUserFacingLlmError(error),
        details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
