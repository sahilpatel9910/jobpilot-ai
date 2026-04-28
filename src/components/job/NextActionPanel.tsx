import Link from "next/link";
import { ArrowRight, FileText, MessageSquareText, Sparkles } from "lucide-react";
import type { ApplicationRecord } from "@/lib/db/types";

type NextAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: typeof Sparkles;
};

export function NextActionPanel({ application }: { application: ApplicationRecord }) {
  const action = getNextAction(application);
  const Icon = action.icon;

  return (
    <section className="rounded-lg border border-pilot-100 bg-pilot-50 p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-pilot-700">
            <Icon size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-pilot-700">Recommended next action</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{action.title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{action.description}</p>
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

function getNextAction(application: ApplicationRecord): NextAction {
  if (application.cover_letter_status === "not_generated") {
    return {
      title: "Generate the tailored cover letter",
      description: "Review the gaps, add any missing context, then generate a letter grounded in this resume and job ad.",
      href: "#cover-letter",
      cta: "Go to cover letter",
      icon: Sparkles
    };
  }

  if (application.status === "Applied") {
    return {
      title: "Record the follow-up plan",
      description: "Add where you applied, recruiter details, and the date you want to follow up.",
      href: "#tracking",
      cta: "Add tracking note",
      icon: MessageSquareText
    };
  }

  if (application.status === "Interview") {
    return {
      title: "Capture interview prep notes",
      description: "Use notes to store interview dates, expected topics, recruiter names, and questions to practise.",
      href: "#tracking",
      cta: "Prepare notes",
      icon: MessageSquareText
    };
  }

  if (application.status === "Rejected") {
    return {
      title: "Review gaps before archiving",
      description: "Compare the gaps against the role, save any lessons, then archive when you are finished with this application.",
      href: "#analysis",
      cta: "Review analysis",
      icon: FileText
    };
  }

  return {
    title: "Move this application forward",
    description: "Use the analysis, resume bullets, cover letter, and status notes to decide the next concrete step.",
    href: "#analysis",
    cta: "Review analysis",
    icon: FileText
  };
}
