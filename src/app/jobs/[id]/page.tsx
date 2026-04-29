import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AnalysisResult } from "@/components/job/AnalysisResult";
import { AgentTrace } from "@/components/job/AgentTrace";
import { ApplicationActions } from "@/components/job/ApplicationActions";
import { ApplicationNotes } from "@/components/job/ApplicationNotes";
import { ApplicationStatusBadge } from "@/components/job/ApplicationStatusBadge";
import { CoverLetterWorkspace } from "@/components/job/CoverLetterWorkspace";
import { NextActionPanel } from "@/components/job/NextActionPanel";
import { StatusHistory } from "@/components/job/StatusHistory";
import { StatusSelect } from "@/components/job/StatusSelect";
import { getApplication, listAgentRuns, listApplicationStatusHistory } from "@/lib/db/applications";
import { formatApplicationDateTime } from "@/lib/format/date";
import { createSupabaseServerClient, getCurrentUser, hasSupabaseServerConfig } from "@/lib/supabase/server";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await getApplication(id);
  const history = await listApplicationStatusHistory(id);
  const agentRuns = await listAgentRuns(id);
  const profileMemory = await loadProfileMemory();

  if (!application) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to tracker
      </Link>
      <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <ApplicationStatusBadge status={application.status} />
              <span className="text-sm text-slate-500">{formatApplicationDateTime(application.created_at)}</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal">{application.job_title}</h1>
            <p className="mt-2 text-base text-slate-600">{application.company_name}</p>
            {application.job_url ? (
              <a
                href={application.job_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-pilot-700 hover:text-pilot-600"
              >
                View job post
                <ExternalLink size={15} aria-hidden="true" />
              </a>
            ) : null}
          </div>
          <div className="space-y-3">
            <StatusSelect applicationId={application.id} status={application.status} />
            <ApplicationActions applicationId={application.id} />
          </div>
        </div>
      </section>

      <NextActionPanel application={application} history={history} />

      <div id="analysis">
        <AnalysisResult
          analysis={{
            summary: application.summary || "",
            requiredSkills: application.required_skills,
            matchScore: application.match_score || 0,
            missingKeywords: application.missing_keywords,
            strengths: application.strengths,
            gaps: application.gaps,
            suggestedBullets: application.suggested_bullets,
            coverLetter: ""
          }}
          coverLetterSlot={
            <CoverLetterWorkspace
              applicationId={application.id}
              companyName={application.company_name}
              jobTitle={application.job_title}
              resumeText={application.resume_text}
              requiredSkills={application.required_skills}
              initialCoverLetter={application.cover_letter || ""}
              initialContext={application.cover_letter_context || ""}
              initialRevisionInstruction={application.cover_letter_revision_instruction || ""}
              initialStatus={application.cover_letter_status || "not_generated"}
              hasProfileSummary={Boolean(profileMemory?.profile_summary)}
              hasCoverLetterPreferences={Boolean(profileMemory?.cover_letter_preferences)}
            />
          }
        />
      </div>

      <div id="tracking" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ApplicationNotes applicationId={application.id} initialNotes={application.notes || ""} />
        <StatusHistory history={history} />
      </div>

      <AgentTrace agentRuns={agentRuns} />
    </div>
  );
}

async function loadProfileMemory() {
  if (!hasSupabaseServerConfig()) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profile_settings")
    .select("profile_summary, cover_letter_preferences")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return null;
  return data;
}
