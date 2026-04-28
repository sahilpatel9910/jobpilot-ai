"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Sparkles } from "lucide-react";
import type { CoverLetterStatus } from "@/lib/db/types";
import { CoverLetterPreview } from "@/components/job/CoverLetterPreview";

type CoverLetterWorkspaceProps = {
  applicationId: string;
  initialCoverLetter: string;
  initialContext: string;
  initialRevisionInstruction: string;
  initialStatus: CoverLetterStatus;
};

type GenerateCoverLetterResponse = {
  coverLetter?: string;
  coverLetterStatus?: CoverLetterStatus;
  error?: string;
  errors?: string[];
};

export function CoverLetterWorkspace({
  applicationId,
  initialCoverLetter,
  initialContext,
  initialRevisionInstruction,
  initialStatus
}: CoverLetterWorkspaceProps) {
  const [coverLetter, setCoverLetter] = useState(initialCoverLetter);
  const [context, setContext] = useState(initialContext);
  const [revisionInstruction, setRevisionInstruction] = useState(initialRevisionInstruction);
  const [status, setStatus] = useState<CoverLetterStatus>(initialStatus);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasCoverLetter = status !== "not_generated" && Boolean(coverLetter);
  const isBusy = isGenerating || isRegenerating;
  const statusLabel = status === "regenerated" ? "Regenerated" : status === "generated" ? "Generated" : "Not generated";

  async function generateCoverLetter() {
    setIsGenerating(true);
    setError(null);
    setMessage(null);

    const payload = await submitCoverLetterRequest({ context });
    setIsGenerating(false);

    if (!payload) return;
    setMessage("Cover letter generated and saved.");
  }

  async function regenerateCoverLetter() {
    if (!revisionInstruction.trim()) {
      setError("Please add what you would like to change before regenerating.");
      return;
    }

    setIsRegenerating(true);
    setError(null);
    setMessage(null);

    const payload = await submitCoverLetterRequest({
      context,
      revisionInstruction,
      previousCoverLetter: coverLetter
    });
    setIsRegenerating(false);

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
      const payload = (await response.json()) as GenerateCoverLetterResponse;

      if (!response.ok) {
        setError(payload.errors?.[0] || payload.error || "Unable to generate cover letter.");
        return null;
      }

      setCoverLetter(payload.coverLetter || "");
      setStatus(payload.coverLetterStatus || "generated");
      return payload;
    } catch {
      setError("Unable to connect to the cover letter generator.");
      return null;
    }
  }

  return (
    <section className="rounded-lg border border-slateLine bg-white shadow-soft">
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
        {!hasCoverLetter ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
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

            <div className="rounded-lg border border-slateLine bg-surface p-4">
              <h3 className="text-sm font-semibold">Before you generate</h3>
              <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-600">
                <li>Check whether a listed gap is actually wrong.</li>
                <li>Add proof from your resume or real experience.</li>
                <li>Tell the agent what not to emphasise.</li>
              </ul>
              <button
                type="button"
                onClick={generateCoverLetter}
                disabled={isGenerating}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-pilot-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pilot-700 focus:outline-none focus:ring-2 focus:ring-pilot-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
                Generate cover letter
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <CoverLetterPreview coverLetter={coverLetter} embedded />

            <div className="grid gap-5 rounded-lg border border-slateLine bg-surface p-4 lg:grid-cols-2">
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
                    disabled={isRegenerating}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {isRegenerating ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <RefreshCw size={17} aria-hidden="true" />}
                    Regenerate cover letter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      </div>
    </section>
  );
}
