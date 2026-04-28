"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
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
    <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
      <div>
        <h2 className="text-base font-semibold">Add context before generating cover letter</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review the gaps below. If any gap is incorrect or needs context, add your explanation before generating the cover letter.
        </p>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium">Extra context for the cover letter</span>
        <textarea
          value={context}
          onChange={(event) => setContext(event.target.value)}
          placeholder="Example: I do have Express.js experience from my Vision Verse project. Do not mention PHP because I only have basic exposure."
          className="min-h-32 w-full resize-y rounded-lg border border-slateLine px-3 py-2.5 text-sm outline-none transition focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
        />
      </label>

      {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

      {!hasCoverLetter ? (
        <button
          type="button"
          onClick={generateCoverLetter}
          disabled={isGenerating}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-pilot-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pilot-700 focus:outline-none focus:ring-2 focus:ring-pilot-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
          Generate cover letter
        </button>
      ) : (
        <div className="mt-5 space-y-5">
          <CoverLetterPreview coverLetter={coverLetter} embedded />
          <div className="rounded-lg border border-slateLine bg-surface p-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">What would you like to change?</span>
              <textarea
                value={revisionInstruction}
                onChange={(event) => setRevisionInstruction(event.target.value)}
                placeholder="Example: Make it more confident, shorter, and add more focus on Next.js and PostgreSQL."
                className="min-h-24 w-full resize-y rounded-lg border border-slateLine px-3 py-2.5 text-sm outline-none transition focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
              />
            </label>
            <button
              type="button"
              onClick={regenerateCoverLetter}
              disabled={isRegenerating}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isRegenerating ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <RefreshCw size={17} aria-hidden="true" />}
              Regenerate cover letter
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
