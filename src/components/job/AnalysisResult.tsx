import type { ReactNode } from "react";
import type { JobAnalysis, JobIntakeInput } from "@/lib/db/types";
import { evaluateAnalysisDecision, type AnalysisDecisionResult } from "@/lib/analysis/decisionLayer";
import { KeywordGapList } from "@/components/job/KeywordGapList";
import { MatchScoreCard } from "@/components/job/MatchScoreCard";
import { CopyButton } from "@/components/ui/CopyButton";

export function AnalysisResult({
  analysis,
  input,
  decisionResult,
  coverLetterSlot
}: {
  analysis: JobAnalysis;
  input?: JobIntakeInput;
  decisionResult?: AnalysisDecisionResult;
  coverLetterSlot?: ReactNode;
}) {
  const intelligence = decisionResult || (input ? evaluateAnalysisDecision(input, analysis) : null);
  const recommendation = intelligence?.recommendation;

  return (
    <div className="space-y-5">
      {recommendation ? <DecisionSummary decision={recommendation} /> : null}
      {recommendation?.domainMismatch ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-5 shadow-soft">
          <h2 className="text-base font-semibold text-rose-950">Domain mismatch warning</h2>
          <p className="mt-2 text-sm leading-6 text-rose-800">
            This job appears to be in a different professional domain. Your resume is aligned with{" "}
            <span className="font-semibold">{recommendation.resumeDomain}</span>, while this role is in{" "}
            <span className="font-semibold">{recommendation.jobDomain}</span>.
          </p>
        </section>
      ) : null}
      {recommendation?.criticalRequirementMissing ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-soft">
          <h2 className="text-base font-semibold text-amber-950">Critical requirement warning</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            This job has critical requirements that are not clearly shown in the resume.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recommendation.criticalMissingItems.map((item) => (
              <span key={item} className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-900">
                {item}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <MatchScoreCard score={analysis.matchScore} />
        <KeywordGapList keywords={analysis.missingKeywords} ats={intelligence?.ats} />
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
      {recommendation?.decision === "Not Recommended" ? (
        <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold">Better matching roles for this resume</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Based on the resume domain and skills, these roles are likely to produce stronger matches.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {recommendation.alternativeRoles.map((role) => (
              <span key={role} className="rounded-full bg-pilot-50 px-3 py-1 text-sm font-semibold text-pilot-800">
                {role}
              </span>
            ))}
          </div>
        </section>
      ) : null}
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
        {recommendation?.decision === "Not Recommended" || recommendation?.domainMismatch ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
            These suggestions are limited because this role is outside the candidate&apos;s main domain. Do not add skills
            or experience that are not true.
          </div>
        ) : null}
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

function DecisionSummary({ decision }: { decision: NonNullable<AnalysisDecisionResult["recommendation"]> }) {
  const tone =
    decision.decision === "Recommended"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : decision.decision === "Risky"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <section className={`rounded-lg border p-5 shadow-soft ${tone}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide">Application decision</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal">Decision: {decision.decision}</h2>
          <p className="mt-2 text-sm leading-6">{decision.reason}</p>
        </div>
        <div className="grid gap-2 text-sm md:min-w-64">
          <div className="rounded-lg bg-white/70 px-3 py-2">
            <span className="font-semibold">Confidence:</span> {decision.confidence}
          </div>
          <div className="rounded-lg bg-white/70 px-3 py-2">
            <span className="font-semibold">Resume domain:</span> {decision.resumeDomain}
          </div>
          <div className="rounded-lg bg-white/70 px-3 py-2">
            <span className="font-semibold">Job domain:</span> {decision.jobDomain}
          </div>
          <div className="rounded-lg bg-white/70 px-3 py-2">
            <span className="font-semibold">Domain confidence:</span> {Math.round(decision.domainConfidence * 100)}%
          </div>
        </div>
      </div>
    </section>
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
