"use client";

import { useState } from "react";
import type { AnalyseJobResponse } from "@/lib/db/types";
import { AnalysisResult } from "@/components/job/AnalysisResult";
import { JobIntakeForm } from "@/components/job/JobIntakeForm";

export default function NewJobPage() {
  const [result, setResult] = useState<AnalyseJobResponse | null>(null);

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
          <div className="rounded-lg border border-slateLine bg-white px-4 py-3 text-sm text-slate-600">
            AI mode: <span className="font-semibold text-ink">{result.mode}</span> · Persistence:{" "}
            <span className="font-semibold text-ink">{result.persistence}</span>
            {result.llmProvider ? (
              <>
                {" "}
                · Provider: <span className="font-semibold text-ink">{result.llmProvider}</span>
              </>
            ) : null}
            {result.persistenceError ? <span className="text-rose-700"> · {result.persistenceError}</span> : null}
          </div>
          <AnalysisResult analysis={result.analysis} />
          {result.application ? (
            <a
              href={`/jobs/${result.application.id}`}
              className="inline-flex rounded-lg bg-pilot-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pilot-700"
            >
              Review gaps and generate cover letter
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
