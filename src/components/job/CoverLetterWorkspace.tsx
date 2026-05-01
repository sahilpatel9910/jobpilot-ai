"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Circle, Loader2, RefreshCw, Search, Settings, Sparkles } from "lucide-react";
import type { CoverLetterStatus } from "@/lib/db/types";
import type { DecisionRecommendation } from "@/lib/analysis/decisionLayer";
import { CoverLetterPreview } from "@/components/job/CoverLetterPreview";

type CoverLetterWorkspaceProps = {
  applicationId: string;
  companyName: string;
  jobTitle: string;
  resumeText: string;
  requiredSkills: string[];
  recommendation?: DecisionRecommendation;
  initialCoverLetter: string;
  initialContext: string;
  initialRevisionInstruction: string;
  initialStatus: CoverLetterStatus;
  hasProfileSummary?: boolean;
  hasCoverLetterPreferences?: boolean;
};

type GenerateCoverLetterResponse = {
  coverLetter?: string;
  coverLetterStatus?: CoverLetterStatus;
  error?: string;
  errors?: string[];
  details?: string;
};

type CoverLetterAction = "generate" | "regenerate" | null;

const coverLetterSteps = [
  {
    title: "Reviewing context",
    description: "Checking your gap notes and revision instruction for safety and relevance."
  },
  {
    title: "Drafting letter",
    description: "Using the saved resume, job description, and analysis to write a grounded draft."
  },
  {
    title: "Quality review",
    description: "Checking recruiter impact, grounding, role fit, and generic wording."
  },
  {
    title: "Saving result",
    description: "Updating the application and preserving the cover-letter agent trace."
  }
];

export function CoverLetterWorkspace({
  applicationId,
  companyName,
  jobTitle,
  resumeText,
  requiredSkills,
  recommendation,
  initialCoverLetter,
  initialContext,
  initialRevisionInstruction,
  initialStatus,
  hasProfileSummary = false,
  hasCoverLetterPreferences = false
}: CoverLetterWorkspaceProps) {
  const [coverLetter, setCoverLetter] = useState(initialCoverLetter);
  const [context, setContext] = useState(initialContext);
  const [revisionInstruction, setRevisionInstruction] = useState(initialRevisionInstruction);
  const [status, setStatus] = useState<CoverLetterStatus>(initialStatus);
  const [activeAction, setActiveAction] = useState<CoverLetterAction>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const hasCoverLetter = status !== "not_generated" && Boolean(coverLetter);
  const isBusy = Boolean(activeAction);
  const [allowNotRecommendedGeneration, setAllowNotRecommendedGeneration] = useState(false);
  const shouldBlockPrimaryGeneration =
    recommendation?.decision === "Not Recommended" && !hasCoverLetter && !allowNotRecommendedGeneration;
  const statusLabel = status === "regenerated" ? "Regenerated" : status === "generated" ? "Generated" : "Not generated";
  const currentStep = useMemo(
    () => coverLetterSteps[Math.min(currentStepIndex, coverLetterSteps.length - 1)],
    [currentStepIndex]
  );

  useEffect(() => {
    if (!activeAction) {
      setCurrentStepIndex(0);
      return;
    }

    const timers = [
      window.setTimeout(() => setCurrentStepIndex(1), 800),
      window.setTimeout(() => setCurrentStepIndex(2), 2600),
      window.setTimeout(() => setCurrentStepIndex(3), 4800)
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [activeAction]);

  async function generateCoverLetter() {
    if (isBusy) return;

    setActiveAction("generate");
    setCurrentStepIndex(0);
    setError(null);
    setErrorDetails(null);
    setMessage(null);

    const payload = await submitCoverLetterRequest({ context });
    setActiveAction(null);

    if (!payload) return;
    setMessage("Cover letter generated and saved.");
  }

  async function regenerateCoverLetter() {
    if (isBusy) return;

    if (!revisionInstruction.trim()) {
      setError("Please add what you would like to change before regenerating.");
      setErrorDetails(null);
      return;
    }

    setActiveAction("regenerate");
    setCurrentStepIndex(0);
    setError(null);
    setErrorDetails(null);
    setMessage(null);

    const payload = await submitCoverLetterRequest({
      context,
      revisionInstruction,
      previousCoverLetter: coverLetter
    });
    setActiveAction(null);

    if (!payload) return;
    setMessage("Cover letter regenerated and saved.");
  }

  async function submitCoverLetterRequest(body: {
    context?: string;
    revisionInstruction?: string;
    previousCoverLetter?: string;
  }) {
    try {
      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          ...body
        })
      });
      const payload = (await readJsonResponse(response)) as GenerateCoverLetterResponse;

      if (!response.ok) {
        setError(payload.errors?.[0] || payload.error || "Unable to generate cover letter. Please adjust the instruction and try again.");
        setErrorDetails(payload.details || null);
        return null;
      }

      setCoverLetter(payload.coverLetter || "");
      setStatus(payload.coverLetterStatus || "generated");
      setRevisionInstruction("");
      setCurrentStepIndex(3);
      return payload;
    } catch (requestError) {
      setError("Unable to connect to the cover letter generator. Check your connection and try again.");
      setErrorDetails(requestError instanceof Error ? requestError.message : null);
      return null;
    }
  }

  return (
    <section id="cover-letter" className="rounded-lg border border-slateLine bg-white shadow-soft">
      <div className="border-b border-slateLine px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-pilot-50 text-sm font-bold text-pilot-700">
                3
              </span>
              <h2 className="text-base font-semibold">Cover letter</h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review the strengths and gaps first. Add context only if the analysis missed something or if you want the letter to handle a gap carefully.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slateLine bg-surface px-3 py-1 text-xs font-semibold text-slate-600">
            {hasCoverLetter ? <CheckCircle2 size={14} className="text-emerald-600" aria-hidden="true" /> : null}
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="rounded-lg border border-slateLine bg-surface p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Profile memory used for this letter</h3>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                JobPilot uses your saved profile summary and cover-letter preferences as private context. This improves
                relevance without training a model on your data.
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-slateLine bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:w-auto"
            >
              <Settings size={16} aria-hidden="true" />
              Edit memory
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <MemoryPill label="Profile summary" active={hasProfileSummary} />
            <MemoryPill label="Cover letter preferences" active={hasCoverLetterPreferences} />
            <MemoryPill label="Job-specific context" active={Boolean(context.trim())} />
          </div>
        </div>

        {recommendation?.decision === "Risky" && !hasCoverLetter ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">Weak match warning</p>
            <p className="mt-1">
              This match is weak. A cover letter may not be useful unless you have relevant experience not shown in your resume.
            </p>
          </div>
        ) : null}

        {shouldBlockPrimaryGeneration ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-rose-700">
                  <AlertTriangle size={18} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-rose-950">Cover letter not recommended</h3>
                  <p className="mt-1 text-sm leading-6 text-rose-800">
                    This role appears outside your resume domain or has critical requirements that are not shown in the
                    resume. A cover letter is unlikely to help unless you have relevant experience that is missing from
                    your resume.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Link
                  href="/jobs/new"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-rose-800 ring-1 ring-rose-200 transition hover:bg-rose-100"
                >
                  <Search size={16} aria-hidden="true" />
                  Find better matching jobs
                </Link>
                <button
                  type="button"
                  onClick={() => setAllowNotRecommendedGeneration(true)}
                  className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  Generate anyway
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {!hasCoverLetter && !shouldBlockPrimaryGeneration ? (
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Optional context before generation</span>
              <textarea
                value={context}
                onChange={(event) => setContext(event.target.value)}
                disabled={isBusy}
                placeholder="Example: I have Express.js experience from my Vision Verse project. Do not mention PHP because I only have basic exposure."
                className="min-h-36 w-full resize-y rounded-lg border border-slateLine px-3 py-2.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
              <p className="text-xs leading-5 text-slate-500">
                Leave this empty if the analysis already looks correct.
              </p>
            </label>

            <div className="flex flex-col gap-4 rounded-lg border border-slateLine bg-surface p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold">Before you generate</h3>
                <ul className="mt-2 grid gap-2 text-sm leading-5 text-slate-600 lg:grid-cols-3">
                  <li>Check whether a listed gap is actually wrong.</li>
                  <li>Add proof from your resume or real experience.</li>
                  <li>Tell the agent what not to emphasise.</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={generateCoverLetter}
                disabled={isBusy}
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-pilot-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pilot-700 focus:outline-none focus:ring-2 focus:ring-pilot-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {activeAction === "generate" ? (
                  <Loader2 className="animate-spin" size={17} aria-hidden="true" />
                ) : (
                  <Sparkles size={17} aria-hidden="true" />
                )}
                {activeAction === "generate" ? currentStep.title : "Generate cover letter"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <CoverLetterPreview
              coverLetter={coverLetter}
              embedded
              documentInput={{
                companyName,
                jobTitle,
                resumeText,
                keywords: requiredSkills
              }}
            />

            <div className="grid gap-5 rounded-lg border border-slateLine bg-surface p-4 xl:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Context used for this draft</span>
                <textarea
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  disabled={isBusy}
                  placeholder="Add or adjust context before regenerating."
                  className="min-h-28 w-full resize-y rounded-lg border border-slateLine bg-white px-3 py-2.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </label>

              <div className="space-y-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Revision instruction</span>
                  <textarea
                    value={revisionInstruction}
                    onChange={(event) => setRevisionInstruction(event.target.value)}
                    disabled={isBusy}
                    placeholder="Example: Make it more confident, shorter, and add more focus on Next.js and PostgreSQL."
                    className="min-h-28 w-full resize-y rounded-lg border border-slateLine bg-white px-3 py-2.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={regenerateCoverLetter}
                    disabled={isBusy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {activeAction === "regenerate" ? (
                      <Loader2 className="animate-spin" size={17} aria-hidden="true" />
                    ) : (
                      <RefreshCw size={17} aria-hidden="true" />
                    )}
                    {activeAction === "regenerate" ? currentStep.title : "Regenerate cover letter"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isBusy ? (
          <div className="rounded-lg border border-pilot-100 bg-pilot-50 p-4" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-pilot-700">
                <Loader2 className="animate-spin" size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{currentStep.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{currentStep.description}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {coverLetterSteps.map((step, index) => {
                const isDone = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div
                    key={step.title}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                      isCurrent
                        ? "border-pilot-200 bg-white text-pilot-800"
                        : isDone
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-slateLine bg-white/70 text-slate-500"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isDone ? (
                        <CheckCircle2 size={14} aria-hidden="true" />
                      ) : isCurrent ? (
                        <Loader2 className="animate-spin" size={14} aria-hidden="true" />
                      ) : (
                        <Circle size={14} aria-hidden="true" />
                      )}
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <p>{error}</p>
            {errorDetails ? <p className="mt-1 text-xs text-rose-600">{errorDetails}</p> : null}
          </div>
        ) : null}
        {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      </div>
    </section>
  );
}

function MemoryPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
        active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slateLine bg-white text-slate-500"
      }`}
    >
      <CheckCircle2 size={13} aria-hidden="true" />
      {label}: {active ? "on" : "not set"}
    </span>
  );
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
