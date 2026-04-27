import type { AgentRunRecord } from "@/lib/db/types";
import { formatApplicationDateTime } from "@/lib/format/date";

export function AgentTrace({ agentRuns }: { agentRuns: AgentRunRecord[] }) {
  return (
    <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
      <h2 className="text-base font-semibold">Agent trace</h2>
      <p className="mt-1 text-sm text-slate-500">
        Current workflow trace. These steps will map cleanly to LangGraph nodes later.
      </p>
      <div className="mt-4 space-y-3">
        {agentRuns.length > 0 ? (
          agentRuns.map((run, index) => (
            <div key={run.id} className="rounded-lg border border-slateLine bg-surface p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {index + 1}. {run.agent_name}
                  </p>
                  {run.input_summary ? <p className="mt-1 text-sm text-slate-600">{run.input_summary}</p> : null}
                </div>
                <span className="rounded-full bg-pilot-50 px-2.5 py-1 text-xs font-semibold text-pilot-700">
                  {run.status}
                </span>
              </div>
              <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-slateLine bg-white p-3 text-xs leading-5 text-slate-700">
                {JSON.stringify(run.output, null, 2)}
              </pre>
              <p className="mt-2 text-xs text-slate-500">{formatApplicationDateTime(run.started_at)}</p>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-slateLine p-4 text-sm text-slate-500">
            Agent traces will appear for newly analysed jobs.
          </p>
        )}
      </div>
    </section>
  );
}
