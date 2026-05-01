"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalyseJobResponse } from "@/lib/db/types";
import { evaluateAnalysisDecision } from "@/lib/analysis/decisionLayer";
import { AnalysisResult } from "@/components/job/AnalysisResult";
import { JobIntakeForm } from "@/components/job/JobIntakeForm";

export default function NewJobPage() {
  const [result, setResult] = useState<AnalyseJobResponse | null>(null);
  const input = result?.application
    ? {
        companyName: result.application.company_name,
        jobTitle: result.application.job_title,
        jobUrl: result.application.job_url || "",
        jobDescription: result.application.job_description,
        resumeText: result.application.resume_text
      }
    : null;
  const decisionResult = result && input ? evaluateAnalysisDecision(input, result.analysis) : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-pilot-700">Job analysis</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Paste a role and resume</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          The workflow runs parser, matcher, ATS keyword, quality review, and tracker agents first. After saving,
          open the job detail page to add gap context and generate the cover letter as a second step.
        </p>
      </div>
      <JobIntakeForm onResult={setResult} />
      {result ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Analysis saved</p>
                <p className="mt-1 text-emerald-800">
                  {decisionResult?.recommendation.decision === "Not Recommended"
                    ? "This looks like a poor-fit role. Review the decision warning before deciding whether to continue."
                    : "Review the gaps, add context if needed, then generate the cover letter from the job detail page."}
                </p>
              </div>
              {result.application ? (
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  {decisionResult?.recommendation.decision === "Not Recommended" ? (
                    <Link
                      href="/jobs/new"
                      className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      Find better matching jobs
                    </Link>
                  ) : null}
                  <Link
                    href={`/jobs/${result.application.id}`}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                      decisionResult?.recommendation.decision === "Not Recommended"
                        ? "border border-emerald-200 bg-emerald-700 text-white hover:bg-emerald-800"
                        : "bg-pilot-600 text-white hover:bg-pilot-700"
                    }`}
                  >
                    {decisionResult?.recommendation.decision === "Not Recommended"
                      ? "Review details / generate anyway"
                      : decisionResult?.recommendation.decision === "Risky"
                        ? "Review weak match"
                        : "Continue to cover letter"}
                  </Link>
                </div>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-emerald-700">
              Mode: <span className="font-semibold">{result.mode}</span> · Persistence:{" "}
              <span className="font-semibold">{result.persistence}</span>
              {result.llmProvider ? <> · Provider: <span className="font-semibold">{result.llmProvider}</span></> : null}
              {result.persistenceError ? <span className="text-rose-700"> · {result.persistenceError}</span> : null}
            </p>
          </div>
          <AnalysisResult analysis={result.analysis} input={input || undefined} decisionResult={decisionResult || undefined} />
        </div>
      ) : null}
    </div>
  );
}
