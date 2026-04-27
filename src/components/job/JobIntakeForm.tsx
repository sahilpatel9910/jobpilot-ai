"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { AnalyseJobResponse, JobIntakeInput } from "@/lib/db/types";

const sampleJob =
  "We are looking for a full-stack engineer to build modern product features using React, Next.js, TypeScript, APIs, SQL databases, and AI-assisted workflows. The role requires strong communication, ownership, testing practices, and experience shipping maintainable customer-facing software.";

export function JobIntakeForm({ onResult }: { onResult: (result: AnalyseJobResponse) => void }) {
  const [form, setForm] = useState<JobIntakeInput>({
    companyName: "Atlas Works",
    jobTitle: "Full Stack AI Engineer",
    jobUrl: "",
    jobDescription: sampleJob,
    resumeText: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [savedResumeText, setSavedResumeText] = useState("");
  const [resumeStatus, setResumeStatus] = useState<"loading" | "empty" | "loaded" | "saving" | "saved" | "failed">(
    "loading"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadResume() {
      try {
        const response = await fetch("/api/profile/resume");
        const payload = (await response.json()) as { resumeText?: string };
        const resumeText = payload.resumeText || "";

        if (!isMounted) return;

        if (resumeText) {
          setSavedResumeText(resumeText);
          setForm((current) => ({ ...current, resumeText }));
          setResumeStatus("loaded");
        } else {
          setResumeStatus("empty");
        }
      } catch {
        if (isMounted) setResumeStatus("failed");
      }
    }

    loadResume();

    return () => {
      isMounted = false;
    };
  }, []);

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setErrorDetails(null);

    const saveResumeResponse = await saveResumeIfChanged();
    if (!saveResumeResponse) {
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/analyse-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const payload = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error || "Unable to analyse this job.");
      setErrorDetails(payload.details || null);
      return;
    }

    onResult(payload as AnalyseJobResponse);
  }

  async function saveResumeIfChanged() {
    const resumeText = form.resumeText.trim();
    if (resumeText === savedResumeText.trim()) return true;

    setResumeStatus("saving");

    const response = await fetch("/api/profile/resume", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText })
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Unable to save resume text.");
      setResumeStatus("failed");
      return false;
    }

    setSavedResumeText(resumeText);
    setResumeStatus("saved");
    return true;
  }

  function updateField(field: keyof JobIntakeInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <form onSubmit={submitForm} className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Company name</span>
          <input
            value={form.companyName}
            onChange={(event) => updateField("companyName", event.target.value)}
            className="w-full rounded-lg border border-slateLine px-3 py-2.5 outline-none transition focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Job title</span>
          <input
            value={form.jobTitle}
            onChange={(event) => updateField("jobTitle", event.target.value)}
            className="w-full rounded-lg border border-slateLine px-3 py-2.5 outline-none transition focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
            required
          />
        </label>
      </div>
      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium">Job URL</span>
        <input
          value={form.jobUrl}
          onChange={(event) => updateField("jobUrl", event.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-slateLine px-3 py-2.5 outline-none transition focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
        />
      </label>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Job description</span>
          <textarea
            value={form.jobDescription}
            onChange={(event) => updateField("jobDescription", event.target.value)}
            className="min-h-72 w-full resize-y rounded-lg border border-slateLine px-3 py-2.5 outline-none transition focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="flex items-center justify-between gap-3 text-sm font-medium">
            Resume text
            <span className="text-xs font-normal text-slate-500">
              {resumeStatus === "loading"
                ? "Checking saved resume"
                : resumeStatus === "empty"
                  ? "Saved on first analysis"
                  : resumeStatus === "saving"
                    ? "Saving resume"
                    : resumeStatus === "saved"
                      ? "Resume saved"
                      : resumeStatus === "loaded"
                        ? "Loaded saved resume"
                        : "Resume save unavailable"}
            </span>
          </span>
          <textarea
            value={form.resumeText}
            onChange={(event) => updateField("resumeText", event.target.value)}
            placeholder="Paste your resume text here. JobPilot saves it after the first analysis and reuses it until you replace it."
            className="min-h-72 w-full resize-y rounded-lg border border-slateLine px-3 py-2.5 outline-none transition focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
            required
          />
        </label>
      </div>
      {error ? (
        <div className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <p>{error}</p>
          {errorDetails ? <p className="mt-1 text-xs text-rose-600">{errorDetails}</p> : null}
        </div>
      ) : null}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Mock mode is used automatically when no LLM key exists.</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-pilot-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pilot-700 focus:outline-none focus:ring-2 focus:ring-pilot-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
          Analyse and save
        </button>
      </div>
    </form>
  );
}
