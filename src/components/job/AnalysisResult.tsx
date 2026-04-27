import type { JobAnalysis } from "@/lib/db/types";
import { CoverLetterPreview } from "@/components/job/CoverLetterPreview";
import { KeywordGapList } from "@/components/job/KeywordGapList";
import { MatchScoreCard } from "@/components/job/MatchScoreCard";

export function AnalysisResult({ analysis }: { analysis: JobAnalysis }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
      <div className="space-y-5">
        <MatchScoreCard score={analysis.matchScore} />
        <KeywordGapList keywords={analysis.missingKeywords} />
      </div>
      <div className="space-y-5">
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
        <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold">Suggested resume bullet improvements</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {analysis.suggestedBullets.map((bullet) => (
              <li key={bullet} className="rounded-lg border border-slateLine bg-surface p-3">
                {bullet}
              </li>
            ))}
          </ul>
        </section>
        <CoverLetterPreview coverLetter={analysis.coverLetter} />
      </div>
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
