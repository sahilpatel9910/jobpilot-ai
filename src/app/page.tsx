import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileText, Gauge, Sparkles } from "lucide-react";
import { listApplications } from "@/lib/db/applications";
import { ApplicationBoard } from "@/components/dashboard/ApplicationBoard";
import { StatsCards } from "@/components/dashboard/StatsCards";

export default async function HomePage() {
  const applications = await listApplications();

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slateLine bg-white p-6 shadow-soft">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-pilot-700">AI job hunt command center</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
              Analyse job descriptions against your resume and save every application.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              MVP v1 focuses on manual job intake, resume matching, ATS keyword gaps, tailored bullet ideas,
              cover letter drafting, and Supabase-backed application tracking.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/jobs/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-pilot-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pilot-700"
              >
                Start analysis
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-slateLine bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
              >
                View tracker
              </Link>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              { icon: FileText, label: "Job Parser Agent", text: "Normalizes role details and job context." },
              { icon: Gauge, label: "Resume Matcher Agent", text: "Scores fit and highlights resume evidence." },
              { icon: ClipboardCheck, label: "ATS Keyword Agent", text: "Extracts required skills and gaps." },
              { icon: Sparkles, label: "Cover Letter Agent", text: "Drafts concise tailored outreach." }
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-slateLine bg-surface p-4">
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-pilot-50 p-2 text-pilot-700">
                    <item.icon size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StatsCards applications={applications} />
      <ApplicationBoard applications={applications} />
    </div>
  );
}
