import { APPLICATION_STATUSES, type ApplicationRecord } from "@/lib/db/types";

export function StatsCards({ applications }: { applications: ApplicationRecord[] }) {
  const analysed = applications.filter((application) => application.status === "Analysed").length;
  const interviews = applications.filter((application) => application.status === "Interview").length;
  const averageScore =
    applications.length === 0
      ? 0
      : Math.round(
          applications.reduce((total, application) => total + (application.match_score || 0), 0) / applications.length
        );

  const stats = [
    { label: "Tracked jobs", value: applications.length },
    { label: "Analysed", value: analysed },
    { label: "Interviews", value: interviews },
    { label: "Avg. match", value: `${averageScore}%` },
    { label: "Statuses", value: APPLICATION_STATUSES.length }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-slateLine bg-white p-4 shadow-soft">
          <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
