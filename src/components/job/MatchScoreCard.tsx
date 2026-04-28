export function MatchScoreCard({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-600" : score >= 65 ? "text-signal" : "text-rose-600";

  return (
    <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Resume match</p>
          <div className="mt-2 flex items-end gap-2">
            <span className={`text-5xl font-semibold tracking-normal ${color}`}>{score}</span>
            <span className="pb-2 text-lg font-medium text-slate-500">/100</span>
          </div>
        </div>
        <div className="w-full sm:max-w-xs">
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-pilot-600" style={{ width: `${score}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">Higher score means stronger resume alignment for this job.</p>
        </div>
      </div>
    </section>
  );
}
