import type { AnalyseJobResponse, ApplicationRecord, JobAnalysis, JobIntakeInput } from "@/lib/db/types";
import { createSupabaseServerClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

export async function applicationTrackerAgent(
  input: JobIntakeInput,
  analysis: JobAnalysis
): Promise<Pick<AnalyseJobResponse, "application" | "persistence" | "persistenceError">> {
  if (!hasSupabaseServerConfig()) {
    return { application: null, persistence: "skipped" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("applications")
      .insert({
        company_name: input.companyName,
        job_title: input.jobTitle,
        job_url: input.jobUrl || null,
        job_description: input.jobDescription,
        resume_text: input.resumeText,
        status: "Analysed",
        match_score: analysis.matchScore,
        summary: analysis.summary,
        required_skills: analysis.requiredSkills,
        strengths: analysis.strengths,
        gaps: analysis.gaps,
        missing_keywords: analysis.missingKeywords,
        suggested_bullets: analysis.suggestedBullets,
        cover_letter: null,
        cover_letter_status: "not_generated"
      })
      .select()
      .single<ApplicationRecord>();

    if (error) {
      return { application: null, persistence: "failed", persistenceError: error.message };
    }

    return { application: data, persistence: "saved" };
  } catch (error) {
    return {
      application: null,
      persistence: "failed",
      persistenceError: error instanceof Error ? error.message : "Unknown Supabase persistence error"
    };
  }
}
