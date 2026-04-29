import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileText, Gauge, Settings, Sparkles } from "lucide-react";
import { listApplications } from "@/lib/db/applications";
import { ApplicationStatusBadge } from "@/components/job/ApplicationStatusBadge";
import { formatApplicationDate } from "@/lib/format/date";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const applications = await listApplications();
  const activeApplications = applications.filter((application) => application.status !== "Archived");
  const recentApplications = activeApplications.slice(0, 4);
  const needsCoverLetter = activeApplications.filter((application) => application.cover_letter_status === "not_generated").length;
  const interviews = activeApplications.filter((application) => application.status === "Interview").length;
  const averageMatch =
    activeApplications.length === 0
      ? 0
      : Math.round(
          activeApplications.reduce((total, application) => total + (application.match_score || 0), 0) / activeApplications.length
        );

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

      {user ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-pilot-700">Workspace snapshot</p>
                <h2 className="mt-1 text-xl font-semibold">What needs attention</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Overview is for quick decisions. Use Tracker when you need filtering, sorting, and full pipeline management.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slateLine bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-surface"
              >
                Open tracker
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Active jobs", value: activeApplications.length, detail: "excluding archived" },
                { label: "Need cover letter", value: needsCoverLetter, detail: "drafts not generated" },
                { label: "Interview stage", value: interviews, detail: "prepare notes" }
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-slateLine bg-surface p-4">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-pilot-100 bg-pilot-50 p-4">
              <p className="text-sm font-semibold text-pilot-800">Average active match: {averageMatch}%</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Use this as a directional signal only. Strong applications still depend on role fit, evidence quality,
                and how well you tailor the cover letter.
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-pilot-700">Recent roles</p>
                <h2 className="mt-1 text-xl font-semibold">Continue work</h2>
              </div>
              <Link href="/jobs/new" className="text-sm font-semibold text-pilot-700 hover:text-pilot-600">
                New analysis
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {recentApplications.length > 0 ? (
                recentApplications.map((application) => (
                  <Link
                    href={`/jobs/${application.id}`}
                    key={application.id}
                    className="block rounded-lg border border-slateLine bg-surface p-3 transition hover:border-pilot-500 hover:bg-pilot-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{application.job_title}</p>
                        <p className="mt-1 text-sm text-slate-500">{application.company_name}</p>
                      </div>
                      <ApplicationStatusBadge status={application.status} />
                    </div>
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      Match {application.match_score ?? 0}% · {formatApplicationDate(application.created_at)}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slateLine p-4 text-sm text-slate-500">
                  No saved jobs yet. Start with a new analysis.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft xl:col-span-2">
            <p className="text-sm font-semibold text-pilot-700">Recommended setup</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                {
                  icon: FileText,
                  title: "Save resume once",
                  text: "Your resume powers matching, profile memory, and future cover letters.",
                  href: "/jobs/new"
                },
                {
                  icon: Settings,
                  title: "Tune profile memory",
                  text: "Edit summary and cover-letter preferences in settings.",
                  href: "/settings"
                },
                {
                  icon: ClipboardCheck,
                  title: "Manage pipeline",
                  text: "Use Tracker for search, filters, statuses, and archived jobs.",
                  href: "/dashboard"
                }
              ].map((item) => (
                <Link key={item.title} href={item.href} className="rounded-lg border border-slateLine bg-surface p-4 transition hover:border-pilot-500 hover:bg-pilot-50">
                  <item.icon size={18} className="text-pilot-700" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Browse first", text: "Open the analysis form and inspect the workflow before creating an account." },
            { title: "Sign in to save", text: "When you run an analysis, JobPilot asks you to log in so the result belongs only to you." },
            { title: "Private tracker", text: "Your dashboard, resume profile, notes, cover letters, and traces are isolated by account." }
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
              <h2 className="text-base font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
