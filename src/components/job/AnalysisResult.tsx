import type { ReactNode } from "react";
import type { JobAnalysis } from "@/lib/db/types";
import { KeywordGapList } from "@/components/job/KeywordGapList";
import { MatchScoreCard } from "@/components/job/MatchScoreCard";
import { CopyButton } from "@/components/ui/CopyButton";

export function AnalysisResult({ analysis, coverLetterSlot }: { analysis: JobAnalysis; coverLetterSlot?: ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <MatchScoreCard score={analysis.matchScore} />
        <KeywordGapList keywords={analysis.missingKeywords} />
      </div>

      <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold">Job summary</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{analysis.summary}</p>
        <div className="mt-5">
          <h3 className="text-sm font-semibold">Key required skills</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.requiredSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-pilot-50 px-3 py-1 text-sm font-medium text-pilot-700">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <TwoColumnList titleA="Strengths from resume" titleB="Weaknesses and gaps" listA={analysis.strengths} listB={analysis.gaps} />
      {coverLetterSlot}
      <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Copy-ready resume bullets</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Use these as targeted edits for this role. Keep only bullets that are true to your experience.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-fit rounded-full bg-surface px-3 py-1 text-xs font-semibold text-slate-600">
              {analysis.suggestedBullets.length} suggestions
            </span>
            <CopyButton value={analysis.suggestedBullets.map((bullet) => `- ${bullet}`).join("\n")} label="Copy all" />
          </div>
        </div>
        <ol className="mt-4 grid gap-3">
          {analysis.suggestedBullets.map((bullet, index) => (
            <li key={bullet} className="rounded-lg border border-slateLine bg-surface p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pilot-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{bullet}</p>
                </div>
                <CopyButton value={bullet} label="Copy" className="shrink-0 sm:px-2.5 sm:py-1.5 sm:text-xs" />
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function TwoColumnList({
  titleA,
  titleB,
  listA,
  listB
}: {
  titleA: string;
  titleB: string;
  listA: string[];
  listB: string[];
}) {
  return (
    <section className="grid gap-5 md:grid-cols-2">
      {[{ title: titleA, list: listA }, { title: titleB, list: listB }].map((group) => (
        <div key={group.title} className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold">{group.title}</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {group.list.map((item) => (
              <li key={item} className="border-l-2 border-pilot-500 pl-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
