export function KeywordGapList({ keywords }: { keywords: string[] }) {
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
