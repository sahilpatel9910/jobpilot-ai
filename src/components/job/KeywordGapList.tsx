import type { AtsKeywordIntelligence } from "@/lib/analysis/decisionLayer";

export function KeywordGapList({ keywords, ats }: { keywords: string[]; ats?: AtsKeywordIntelligence }) {
  if (ats) {
    return (
      <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">ATS keyword intelligence</h2>
            <p className="mt-1 text-sm text-slate-500">Matched, missing, transferable, and irrelevant terms for this role.</p>
          </div>
          <span className="w-fit rounded-full bg-pilot-50 px-3 py-1 text-xs font-semibold text-pilot-800">
            ATS match {ats.matchPercentage}%
          </span>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <KeywordGroup title="Matched keywords" tone="matched" keywords={ats.matchedKeywords} emptyText="No strong direct keyword matches." />
          <KeywordGroup title="Missing keywords" tone="missing" keywords={ats.missingKeywords} emptyText="No major keyword gaps detected." />
          <KeywordGroup
            title="Weak / transferable overlap"
            tone="transferable"
            keywords={ats.weakTransferableKeywords}
            emptyText="No meaningful transferable overlap detected."
          />
          <KeywordGroup
            title="Irrelevant resume keywords for this job"
            tone="irrelevant"
            keywords={ats.irrelevantResumeKeywords}
            emptyText="No obviously irrelevant resume keywords detected."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Missing keywords</h2>
          <p className="mt-1 text-sm text-slate-500">Terms from the job ad that are weak or missing in the resume.</p>
        </div>
        <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          {keywords.length} gaps
        </span>
      </div>
      {keywords.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span key={keyword} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-800">
              {keyword}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No major keyword gaps detected.</p>
      )}
    </section>
  );
}

function KeywordGroup({
  title,
  tone,
  keywords,
  emptyText
}: {
  title: string;
  tone: "matched" | "missing" | "transferable" | "irrelevant";
  keywords: string[];
  emptyText: string;
}) {
  const toneClass =
    tone === "matched"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "missing"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "transferable"
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : "border-slateLine bg-surface text-slate-600";

  return (
    <div className="rounded-lg border border-slateLine bg-surface p-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {keywords.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span key={keyword} className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>
              {keyword}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}
