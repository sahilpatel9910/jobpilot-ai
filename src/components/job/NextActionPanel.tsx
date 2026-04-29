import Link from "next/link";
import { ArrowRight, AlertCircle, CheckCircle2, FileText, MessageSquareText, Sparkles } from "lucide-react";
import type { ApplicationRecord, ApplicationStatusHistoryRecord } from "@/lib/db/types";
import { applicationFollowUpAgent } from "@/lib/ai/agents/applicationFollowUpAgent";

export function NextActionPanel({
  application,
  history = []
}: {
  application: ApplicationRecord;
  history?: ApplicationStatusHistoryRecord[];
}) {
  const action = applicationFollowUpAgent(application, history);
  const Icon = getActionIcon(action.href);
  const urgencyClass =
    action.urgency === "high"
      ? "border-rose-100 bg-rose-50 text-rose-700"
      : action.urgency === "medium"
        ? "border-amber-100 bg-amber-50 text-amber-700"
        : "border-pilot-100 bg-pilot-50 text-pilot-700";

  return (
    <section className="rounded-lg border border-pilot-100 bg-pilot-50 p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-pilot-700">
            <Icon size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-pilot-700">Recommended next action</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-ink">{action.title}</h2>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${urgencyClass}`}>
                <AlertCircle size={13} aria-hidden="true" />
                {action.urgency} priority
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{action.description}</p>
            <ul className="mt-3 grid gap-2 text-xs font-medium text-slate-600 sm:grid-cols-3">
              {action.checklist.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 text-pilot-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Link
          href={action.href}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-pilot-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pilot-700 focus:outline-none focus:ring-2 focus:ring-pilot-500 focus:ring-offset-2"
        >
          {action.cta}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function getActionIcon(href: string) {
  if (href === "#cover-letter") return Sparkles;
  if (href === "#tracking") return MessageSquareText;
  return FileText;
}
