import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-slateLine bg-white p-8 text-center shadow-soft">
      <h1 className="text-2xl font-semibold">Application not found</h1>
      <p className="mt-3 text-sm text-slate-600">This job may not exist yet, or Supabase is not configured locally.</p>
      <Link
        href="/jobs/new"
        className="mt-6 inline-flex rounded-lg bg-pilot-600 px-4 py-2.5 text-sm font-semibold text-white"
      >
        Create analysis
      </Link>
    </div>
  );
}
