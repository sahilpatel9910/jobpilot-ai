"use client";

import Link from "next/link";
import { APPLICATION_STATUSES, type ApplicationRecord } from "@/lib/db/types";
import { ApplicationStatusBadge } from "@/components/job/ApplicationStatusBadge";

export function ApplicationBoard({ applications }: { applications: ApplicationRecord[] }) {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      {APPLICATION_STATUSES.map((status) => {
        const grouped = applications.filter((application) => application.status === status);

        return (
          <div key={status} className="min-h-52 rounded-lg border border-slateLine bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <ApplicationStatusBadge status={status} />
              <span className="text-sm font-medium text-slate-500">{grouped.length}</span>
            </div>
            <div className="mt-4 space-y-3">
              {grouped.length > 0 ? (
                grouped.map((application) => (
                  <Link
                    href={`/jobs/${application.id}`}
                    key={application.id}
                    className="block rounded-lg border border-slateLine bg-surface p-3 transition hover:border-pilot-500 hover:bg-pilot-50"
                  >
                    <p className="text-sm font-semibold">{application.job_title}</p>
                    <p className="mt-1 text-sm text-slate-500">{application.company_name}</p>
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      Match {application.match_score ?? 0}% · {new Date(application.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-slateLine p-4 text-sm text-slate-500">No jobs here yet.</p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
