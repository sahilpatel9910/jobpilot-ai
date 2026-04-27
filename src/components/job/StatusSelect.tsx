"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/db/types";

export function StatusSelect({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) {
  const [value, setValue] = useState(status);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function updateStatus(nextStatus: ApplicationStatus) {
    setValue(nextStatus);
    setIsSaving(true);
    await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    setIsSaving(false);
    router.refresh();
  }

  return (
    <label className="flex items-center gap-3 text-sm font-medium">
      Status
      <select
        value={value}
        onChange={(event) => updateStatus(event.target.value as ApplicationStatus)}
        disabled={isSaving}
        className="rounded-lg border border-slateLine bg-white px-3 py-2 outline-none focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
      >
        {APPLICATION_STATUSES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
