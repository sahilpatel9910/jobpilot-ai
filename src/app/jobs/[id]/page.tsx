import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AnalysisResult } from "@/components/job/AnalysisResult";
import { ApplicationStatusBadge } from "@/components/job/ApplicationStatusBadge";
import { StatusSelect } from "@/components/job/StatusSelect";
import { getApplication } from "@/lib/db/applications";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await getApplication(id);

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
              <span className="text-sm text-slate-500">{new Date(application.created_at).toLocaleString()}</span>
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
          <StatusSelect applicationId={application.id} status={application.status} />
        </div>
      </section>

      <AnalysisResult
        analysis={{
          summary: application.summary || "",
          requiredSkills: application.required_skills,
          matchScore: application.match_score || 0,
          missingKeywords: application.missing_keywords,
          strengths: application.strengths,
          gaps: application.gaps,
          suggestedBullets: application.suggested_bullets,
          coverLetter: application.cover_letter || ""
        }}
      />
    </div>
  );
}
