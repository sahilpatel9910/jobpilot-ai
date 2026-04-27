export function KeywordGapList({ keywords }: { keywords: string[] }) {
  return (
    <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
      <h2 className="text-base font-semibold">Missing keywords</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {keywords.length > 0 ? (
          keywords.map((keyword) => (
            <span key={keyword} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-800">
              {keyword}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-500">No major keyword gaps detected.</p>
        )}
      </div>
    </section>
  );
}
