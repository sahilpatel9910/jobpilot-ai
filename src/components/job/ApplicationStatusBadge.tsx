import type { ApplicationStatus } from "@/lib/db/types";

const styles: Record<ApplicationStatus, string> = {
  Saved: "bg-slate-100 text-slate-700",
  Analysed: "bg-pilot-50 text-pilot-700",
  Applied: "bg-blue-50 text-blue-700",
  Interview: "bg-amber-50 text-amber-700",
  Rejected: "bg-rose-50 text-rose-700",
  Offer: "bg-emerald-50 text-emerald-700"
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>;
}
