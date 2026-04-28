"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, Trash2 } from "lucide-react";

export function ApplicationActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function archiveApplication() {
    setError(null);
    setIsArchiving(true);

    const response = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Archived", note: "Archived from job detail actions." })
    });

    setIsArchiving(false);

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error || "Unable to archive application.");
      return;
    }

    router.refresh();
  }

  async function deleteApplication() {
    const confirmed = window.confirm("Delete this application permanently? This cannot be undone.");
    if (!confirmed) return;

    setError(null);
    setIsDeleting(true);

    const response = await fetch(`/api/applications/${applicationId}`, {
      method: "DELETE"
    });

    setIsDeleting(false);

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error || "Unable to delete application.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={archiveApplication}
          disabled={isArchiving || isDeleting}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slateLine bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Archive size={16} aria-hidden="true" />
          {isArchiving ? "Archiving" : "Archive"}
        </button>
        <button
          type="button"
          onClick={deleteApplication}
          disabled={isArchiving || isDeleting}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 size={16} aria-hidden="true" />
          {isDeleting ? "Deleting" : "Delete"}
        </button>
      </div>
      {error ? <p className="text-right text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
