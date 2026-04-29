import { NextResponse } from "next/server";
import { createAgentTrace, persistAgentTrace } from "@/lib/ai/agentTrace";
import { toUserFacingLlmError } from "@/lib/ai/analysisValidator";
import { coverLetterAgent } from "@/lib/ai/agents/coverLetterAgent";
import { qualityReviewAgent } from "@/lib/ai/agents/qualityReviewAgent";
import type { CoverLetterStatus, JobAnalysis, JobIntakeInput } from "@/lib/db/types";
import { createSupabaseServerClient, getCurrentUser, hasSupabaseServerConfig } from "@/lib/supabase/server";
import { validateCoverLetterInput } from "@/lib/security/validateCoverLetterInput";

type GenerateCoverLetterBody = {
  applicationId?: string;
  context?: string;
  revisionInstruction?: string;
  previousCoverLetter?: string;
};

export async function POST(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to generate cover letters." }, { status: 401 });
  }

  const body = (await request.json()) as GenerateCoverLetterBody;
  if (!body.applicationId) {
    return NextResponse.json({ error: "Application ID is required." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data: application, error: loadError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", body.applicationId)
    .eq("user_id", user.id)
    .single();

  if (loadError || !application) {
    return NextResponse.json({ error: "Application was not found." }, { status: 404 });
  }

  const isRegeneration = Boolean(body.revisionInstruction?.trim() || body.previousCoverLetter?.trim());
  const validation = validateCoverLetterInput({
    context: body.context,
    revisionInstruction: body.revisionInstruction,
    requireRevisionInstruction: isRegeneration
  });

  if (!validation.isValid) {
    return NextResponse.json(
      {
        error: validation.errors[0] || "Please check the cover letter context before continuing.",
        errors: validation.errors,
        warnings: validation.warnings,
        validation: {
          riskLevel: validation.riskLevel,
          detectedIssues: validation.detectedIssues
        }
      },
      { status: 400 }
    );
  }

  const analysis = toAnalysis(application);
  const input = toInput(application);
  const readinessError = validateApplicationReadiness(analysis, input);

  if (readinessError) {
    return NextResponse.json({ error: readinessError }, { status: 400 });
  }

  try {
    const traces = [
      createAgentTrace("Cover Letter Context Review", "Validate user context before cover letter generation.", {
        contextProvided: Boolean(validation.context),
        revisionInstructionProvided: Boolean(validation.revisionInstruction),
        promptInjectionRisk: titleCase(validation.riskLevel),
        warnings: validation.warnings,
        detectedIssues: validation.detectedIssues
      })
    ];
    const previousCoverLetter = body.previousCoverLetter || application.cover_letter || "";
    const { data: profileSettings } = await supabase
      .from("profile_settings")
      .select("profile_summary, cover_letter_preferences")
      .eq("user_id", user.id)
      .maybeSingle();
    const generation = await coverLetterAgent({
      input,
      analysis,
      context: validation.context,
      profileSummary: profileSettings?.profile_summary || "",
      coverLetterPreferences: profileSettings?.cover_letter_preferences || "",
      previousCoverLetter,
      revisionInstruction: validation.revisionInstruction
    });
    const nextStatus: CoverLetterStatus = validation.revisionInstruction ? "regenerated" : "generated";

    traces.push(
      createAgentTrace(
        validation.revisionInstruction ? "Cover Letter Regeneration Agent" : "Cover Letter Agent",
        validation.revisionInstruction
          ? "Regenerate cover letter from existing analysis, previous draft, and revision instruction."
          : "Generate cover letter from saved analysis and optional user gap context.",
        {
          mode: generation.mode,
          provider: generation.provider,
          wordCount: generation.coverLetter.split(/\s+/).filter(Boolean).length,
          status: nextStatus
        }
      )
    );

    const coverLetterReview = qualityReviewAgent(input, { ...analysis, coverLetter: generation.coverLetter }, { includeCoverLetter: true });
    traces.push(
      createAgentTrace("Cover Letter Quality Review", "Review generated cover letter for grounding and recruiter impact.", {
        qualityScore: coverLetterReview.qualityScore,
        passed: coverLetterReview.passed,
        warnings: coverLetterReview.warnings,
        recommendations: coverLetterReview.recommendations,
        categoryScores: coverLetterReview.categoryScores,
        checks: coverLetterReview.checks
      })
    );

    const { data: updatedApplication, error: updateError } = await supabase
      .from("applications")
      .update({
        cover_letter: generation.coverLetter,
        cover_letter_context: validation.context || null,
        cover_letter_revision_instruction: validation.revisionInstruction || null,
        cover_letter_generated_at: new Date().toISOString(),
        cover_letter_status: nextStatus
      })
      .eq("id", application.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await persistAgentTrace(application.id, traces);

    return NextResponse.json({
      application: updatedApplication,
      coverLetter: generation.coverLetter,
      coverLetterStatus: nextStatus,
      warnings: validation.warnings,
      mode: generation.mode,
      llmProvider: generation.provider
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

function toAnalysis(application: {
  summary: string | null;
  required_skills: string[];
  match_score: number | null;
  missing_keywords: string[];
  strengths: string[];
  gaps: string[];
  suggested_bullets: string[];
  cover_letter: string | null;
}): JobAnalysis {
  return {
    summary: application.summary || "",
    requiredSkills: application.required_skills || [],
    matchScore: application.match_score || 0,
    missingKeywords: application.missing_keywords || [],
    strengths: application.strengths || [],
    gaps: application.gaps || [],
    suggestedBullets: application.suggested_bullets || [],
    coverLetter: application.cover_letter || ""
  };
}

function toInput(application: {
  company_name: string;
  job_title: string;
  job_url: string | null;
  job_description: string;
  resume_text: string;
}): JobIntakeInput {
  return {
    companyName: application.company_name,
    jobTitle: application.job_title,
    jobUrl: application.job_url || "",
    jobDescription: application.job_description,
    resumeText: application.resume_text
  };
}

function validateApplicationReadiness(analysis: JobAnalysis, input: JobIntakeInput) {
  if (!input.jobDescription || !input.resumeText) return "Application is missing resume or job description text.";
  if (!analysis.summary || !analysis.requiredSkills.length || !analysis.strengths.length || !analysis.gaps.length) {
    return "Application analysis is incomplete. Re-run the job analysis before generating a cover letter.";
  }
  return null;
}

function titleCase(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
