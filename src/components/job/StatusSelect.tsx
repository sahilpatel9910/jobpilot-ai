"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/db/types";

export function StatusSelect({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) {
  const [value, setValue] = useState(status);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function updateStatus() {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value, note })
    });

    setIsSaving(false);

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error || "Unable to update status.");
      return;
    }

    setNote("");
    setMessage("Status updated");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-slateLine bg-surface p-3">
      <label className="block text-sm font-semibold">
        Status
        <select
          value={value}
          onChange={(event) => setValue(event.target.value as ApplicationStatus)}
          disabled={isSaving}
          className="mt-2 w-full rounded-lg border border-slateLine bg-white px-3 py-2 outline-none focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
        >
          {APPLICATION_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Status note
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={isSaving}
          maxLength={500}
        placeholder="Example: Applied through company website, recruiter replied, interview booked for Friday."
          className="mt-2 min-h-20 w-full resize-y rounded-lg border border-slateLine bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
        />
      </label>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">{note.length}/500</p>
        <button
          type="button"
          onClick={updateStatus}
          disabled={isSaving || value === status}
          className="inline-flex items-center justify-center rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving" : "Save status"}
        </button>
      </div>
      {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
