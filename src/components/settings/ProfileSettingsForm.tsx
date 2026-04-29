"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";

type ProfileSettingsFormProps = {
  initialProfileSummary: string;
  initialCoverLetterPreferences: string;
  hasResume: boolean;
};

type ProfileSettingsResponse = {
  error?: string;
};

export function ProfileSettingsForm({
  initialProfileSummary,
  initialCoverLetterPreferences,
  hasResume
}: ProfileSettingsFormProps) {
  const [profileSummary, setProfileSummary] = useState(initialProfileSummary);
  const [coverLetterPreferences, setCoverLetterPreferences] = useState(initialCoverLetterPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/profile/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileSummary, coverLetterPreferences })
      });
      const payload = (await readJsonResponse(response)) as ProfileSettingsResponse;

      if (!response.ok) {
        setError(payload.error || "Unable to save profile settings.");
        return;
      }

      setMessage("Profile memory saved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save profile settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={saveSettings} className="space-y-5 rounded-lg border border-slateLine bg-white p-5 shadow-soft">
      {!hasResume ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Add your resume from a new analysis first. JobPilot will create an initial profile summary from it.
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-semibold">Personal profile summary</span>
        <textarea
          value={profileSummary}
          onChange={(event) => setProfileSummary(event.target.value)}
          className="min-h-72 w-full resize-y rounded-lg border border-slateLine px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
          placeholder="Your saved resume summary will appear here after you add a resume."
        />
        <p className="text-xs leading-5 text-slate-500">
          This is private memory used to keep future cover letters grounded in your real background. Edit it when your
          experience changes.
        </p>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold">Cover letter preferences</span>
        <textarea
          value={coverLetterPreferences}
          onChange={(event) => setCoverLetterPreferences(event.target.value)}
          className="min-h-40 w-full resize-y rounded-lg border border-slateLine px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
          placeholder="Example: Keep tone confident and graduate-friendly. Avoid overusing PHP. Mention Australian work rights only when I provide them."
        />
        <p className="text-xs leading-5 text-slate-500">
          These preferences are passed into cover-letter generation so repeated drafts adapt to your style.
        </p>
      </label>

      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-pilot-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pilot-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}
          Save profile memory
        </button>
      </div>
    </form>
  );
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
