import type { ApplicationStatusHistoryRecord } from "@/lib/db/types";
import { formatApplicationDateTime } from "@/lib/format/date";

export function StatusHistory({ history }: { history: ApplicationStatusHistoryRecord[] }) {
  return (
    <section className="rounded-lg border border-slateLine bg-white p-5 shadow-soft">
      <h2 className="text-base font-semibold">Status history</h2>
      <div className="mt-4 space-y-3">
        {history.length > 0 ? (
          history.map((item) => (
            <div key={item.id} className="rounded-lg border border-slateLine bg-surface p-3 text-sm">
              <p className="font-medium text-ink">
                {item.from_status || "Created"} → {item.to_status}
              </p>
              <p className="mt-1 text-xs text-slate-500">{formatApplicationDateTime(item.created_at)}</p>
              {item.note ? <p className="mt-2 text-slate-600">{item.note}</p> : null}
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-slateLine p-4 text-sm text-slate-500">
            Status changes will appear here.
          </p>
        )}
      </div>
    </section>
  );
}
