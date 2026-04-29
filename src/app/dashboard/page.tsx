import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { ApplicationBoard } from "@/components/dashboard/ApplicationBoard";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { listApplications } from "@/lib/db/applications";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const applications = await listApplications();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-pilot-700">Application tracker</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">Pipeline dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Manage saved roles here: search, filter by status, sort by match score, and scan private job-note previews.
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-pilot-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pilot-700"
        >
          <Plus size={17} aria-hidden="true" />
          New analysis
        </Link>
      </div>
      <StatsCards applications={applications} />
      <ApplicationBoard applications={applications} />
    </div>
  );
}
