"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Archive, Search } from "lucide-react";
import { APPLICATION_STATUSES, type ApplicationRecord } from "@/lib/db/types";
import { ApplicationStatusBadge } from "@/components/job/ApplicationStatusBadge";
import { formatApplicationDate } from "@/lib/format/date";

type SortMode = "newest" | "oldest" | "match-high" | "match-low";
type StatusFilter = "All" | (typeof APPLICATION_STATUSES)[number];

const activeStatuses = APPLICATION_STATUSES.filter((status) => status !== "Archived");

export function ApplicationBoard({ applications }: { applications: ApplicationRecord[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [showArchived, setShowArchived] = useState(false);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return applications
      .filter((application) => showArchived || application.status !== "Archived")
      .filter((application) => statusFilter === "All" || application.status === statusFilter)
      .filter((application) => {
        if (!normalizedQuery) return true;
        return [application.company_name, application.job_title, application.job_url || "", application.summary || ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((left, right) => {
        if (sortMode === "oldest") return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
        if (sortMode === "match-high") return (right.match_score ?? -1) - (left.match_score ?? -1);
        if (sortMode === "match-low") return (left.match_score ?? 101) - (right.match_score ?? 101);
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      });
  }, [applications, query, showArchived, sortMode, statusFilter]);

  const visibleStatuses = showArchived ? APPLICATION_STATUSES : activeStatuses;
  const visibleCount = filteredApplications.length;
  const totalVisiblePool = applications.filter((application) => showArchived || application.status !== "Archived").length;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slateLine bg-white p-4 shadow-soft">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="relative block">
            <span className="sr-only">Search applications</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company, role, URL, or summary"
              className="w-full rounded-lg border border-slateLine py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
            />
          </label>

          <label className="block">
            <span className="sr-only">Sort applications</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="w-full rounded-lg border border-slateLine bg-white px-3 py-2.5 text-sm font-medium outline-none transition focus:border-pilot-500 focus:ring-2 focus:ring-pilot-100"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="match-high">Highest match</option>
              <option value="match-low">Lowest match</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              const nextShowArchived = !showArchived;
              setShowArchived(nextShowArchived);
              if (!nextShowArchived && statusFilter === "Archived") setStatusFilter("All");
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
              showArchived
                ? "border-pilot-200 bg-pilot-50 text-pilot-800"
                : "border-slateLine bg-white text-slate-600 hover:bg-surface"
            }`}
          >
            <Archive size={16} aria-hidden="true" />
            {showArchived ? "Showing archived" : "Show archived"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(["All", ...visibleStatuses] as StatusFilter[]).map((status) => {
            const count =
              status === "All"
                ? totalVisiblePool
                : applications.filter((application) => application.status === status && (showArchived || status !== "Archived")).length;
            const active = statusFilter === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-pilot-200 bg-pilot-50 text-pilot-800"
                    : "border-slateLine bg-white text-slate-600 hover:bg-surface"
                }`}
              >
                {status} <span className="text-slate-400">{count}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs font-medium text-slate-500">
          Showing {visibleCount} of {totalVisiblePool} {totalVisiblePool === 1 ? "application" : "applications"}.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {visibleStatuses.map((status) => {
          const grouped = filteredApplications.filter((application) => application.status === status);

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
                        Match {application.match_score ?? 0}% · {formatApplicationDate(application.created_at)}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-slateLine p-4 text-sm text-slate-500">
                    {query || statusFilter !== "All" ? "No matching jobs here." : "No jobs here yet."}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
