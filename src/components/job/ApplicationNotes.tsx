"use client";

import { useState } from "react";
import { Save } from "lucide-react";

export function ApplicationNotes({ applicationId, initialNotes }: { applicationId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveNotes() {
    setIsSaving(true);
    setMessage(null);

    const response = await fetch(`/api/applications/${applicationId}/notes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes })
    });

    setIsSaving(false);
    setMessage(response.ok ? "Notes saved" : "Unable to save notes");
  }

  return (
    <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Private job notes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Persistent notes for this application. A short preview appears on the tracker card.
          </p>
        </div>
        <button
          type="button"
          onClick={saveNotes}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-pilot-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-pilot-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={16} aria-hidden="true" />
          {isSaving ? "Saving" : "Save job notes"}
        </button>
      </div>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Example: Recruiter name, follow-up date, interview prep points, salary notes, or next action."
        className="mt-4 min-h-40 w-full resize-y rounded-lg border border-slateLine px-3 py-2.5 text-sm outline-none transition focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
      />
      {message ? <p className="mt-2 text-sm text-slate-500">{message}</p> : null}
    </section>
  );
}
