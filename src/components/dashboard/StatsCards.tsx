import type { ApplicationRecord } from "@/lib/db/types";

export function StatsCards({ applications }: { applications: ApplicationRecord[] }) {
  const activeApplications = applications.filter((application) => application.status !== "Archived");
  const scoredApplications = activeApplications.filter((application) => typeof application.match_score === "number");
  const analysed = activeApplications.filter((application) => application.status === "Analysed").length;
  const interviews = activeApplications.filter((application) => application.status === "Interview").length;
  const archived = applications.filter((application) => application.status === "Archived").length;
  const averageScore =
    scoredApplications.length === 0
      ? 0
      : Math.round(
          scoredApplications.reduce((total, application) => total + (application.match_score || 0), 0) / scoredApplications.length
        );

  const stats = [
    { label: "Active jobs", value: activeApplications.length },
    { label: "Analysed", value: analysed },
    { label: "Interviews", value: interviews },
    { label: "Archived", value: archived },
    { label: "Avg. match", value: `${averageScore}%` }
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
