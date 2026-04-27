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
          The workflow runs parser, matcher, ATS keyword, cover letter, and tracker agents. With no LLM key,
          the app returns mock analysis so the full UI stays usable.
        </p>
      </div>
      <JobIntakeForm onResult={setResult} />
      {result ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-slateLine bg-white px-4 py-3 text-sm text-slate-600">
            AI mode: <span className="font-semibold text-ink">{result.mode}</span> · Persistence:{" "}
            <span className="font-semibold text-ink">{result.persistence}</span>
            {result.persistenceError ? <span className="text-rose-700"> · {result.persistenceError}</span> : null}
          </div>
          <AnalysisResult analysis={result.analysis} />
        </div>
      ) : null}
    </div>
  );
}
