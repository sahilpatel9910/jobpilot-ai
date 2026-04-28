import { CheckCircle2, ChevronDown, CircleAlert } from "lucide-react";
import type { AgentRunRecord } from "@/lib/db/types";
import { formatApplicationDateTime } from "@/lib/format/date";

export function AgentTrace({ agentRuns }: { agentRuns: AgentRunRecord[] }) {
  const completedCount = agentRuns.filter((run) => run.status === "completed").length;
  const failedCount = agentRuns.filter((run) => run.status === "failed").length;

  return (
    <section className="rounded-lg border border-slateLine bg-white shadow-soft">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Workflow details</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              A quick health check of the AI steps. Technical output stays hidden unless you need it.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
              {completedCount}/{agentRuns.length} completed
            </span>
            {failedCount > 0 ? (
              <span className="hidden rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 sm:inline-flex">
                {failedCount} failed
              </span>
            ) : null}
            <ChevronDown
              size={18}
              className="text-slate-500 transition group-open:rotate-180"
              aria-hidden="true"
            />
          </div>
        </summary>

        <div className="space-y-3 border-t border-slateLine p-5">
          {agentRuns.length > 0 ? (
            agentRuns.map((run, index) => (
              <article key={run.id} className="rounded-lg border border-slateLine bg-surface p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {index + 1}. {friendlyAgentName(run.agent_name)}
                    </p>
                    {run.input_summary ? <p className="mt-1 text-sm leading-6 text-slate-600">{run.input_summary}</p> : null}
                  </div>
                  <StatusPill status={run.status} />
                </div>

                <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700 md:grid-cols-2">
                  {getRunHighlights(run).map((highlight) => (
                    <li key={highlight} className="flex gap-2">
                      <CheckCircle2 size={16} className="mt-1 shrink-0 text-pilot-600" aria-hidden="true" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <span>{formatApplicationDateTime(run.started_at)}</span>
                  <details>
                    <summary className="cursor-pointer font-semibold text-slate-600 hover:text-ink">
                      Developer details
                    </summary>
                    <pre className="mt-2 max-h-44 overflow-auto rounded-lg border border-slateLine bg-white p-3 text-xs leading-5 text-slate-700">
                      {JSON.stringify(run.output, null, 2)}
                    </pre>
                  </details>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-slateLine p-4 text-sm text-slate-500">
              Workflow details will appear for newly analysed jobs.
            </p>
          )}
        </div>
      </details>
    </section>
  );
}

function StatusPill({ status }: { status: AgentRunRecord["status"] }) {
  const isCompleted = status === "completed";

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isCompleted ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {isCompleted ? <CheckCircle2 size={14} aria-hidden="true" /> : <CircleAlert size={14} aria-hidden="true" />}
      {isCompleted ? "Completed" : "Needs attention"}
    </span>
  );
}

function friendlyAgentName(agentName: string) {
  return agentName
    .replace(/Agent$/i, "agent")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRunHighlights(run: AgentRunRecord) {
  const output = run.output || {};
  const name = run.agent_name.toLowerCase();

  if (name.includes("input validation")) {
    return compact([
      `Input validation: ${stringValue(output.inputValidation) || "Passed"}`,
      `Prompt injection risk: ${stringValue(output.promptInjectionRisk) || "Low"}`,
      `Resume: ${stringValue(output.resumeClassification) || "Checked"}`,
      `Job description: ${stringValue(output.jobDescriptionClassification) || "Checked"}`
    ]);
  }

  if (name.includes("quality review")) {
    return compact([
      numberValue(output.qualityScore) !== null ? `Quality score: ${numberValue(output.qualityScore)}/100` : null,
      booleanValue(output.passed) !== null ? `Review result: ${booleanValue(output.passed) ? "Passed" : "Needs improvement"}` : null,
      Array.isArray(output.warnings) ? `Warnings: ${output.warnings.length}` : null,
      Array.isArray(output.recommendations) ? `Recommendations: ${output.recommendations.length}` : null
    ]);
  }

  if (name.includes("cover letter")) {
    const coverLetter = stringValue(output.coverLetter);
    return compact([
      coverLetter ? `Draft length: ${coverLetter.split(/\s+/).filter(Boolean).length} words` : null,
      stringValue(output.status) ? `Status: ${stringValue(output.status)}` : null,
      "Grounding and tone checked before saving"
    ]);
  }

  if (name.includes("parser")) {
    return compact([
      stringValue(output.normalizedCompanyName) ? `Company normalized: ${stringValue(output.normalizedCompanyName)}` : null,
      stringValue(output.normalizedJobTitle) ? `Role normalized: ${stringValue(output.normalizedJobTitle)}` : null,
      stringValue(output.detectedSeniority) ? `Seniority signal: ${stringValue(output.detectedSeniority)}` : null
    ]);
  }

  if (name.includes("resume matcher")) {
    return compact([
      numberValue(output.matchScore) !== null ? `Match score: ${numberValue(output.matchScore)}%` : null,
      Array.isArray(output.strengths) ? `Strengths found: ${output.strengths.length}` : null,
      Array.isArray(output.gaps) ? `Gaps found: ${output.gaps.length}` : null
    ]);
  }

  if (name.includes("ats")) {
    return compact([
      Array.isArray(output.requiredSkills) ? `Required skills: ${output.requiredSkills.length}` : null,
      Array.isArray(output.missingKeywords) ? `Missing keywords: ${output.missingKeywords.length}` : null
    ]);
  }

  if (name.includes("tracker")) {
    return compact([
      stringValue(output.status) ? `Application status: ${stringValue(output.status)}` : null,
      stringValue(output.persistence) ? `Persistence: ${stringValue(output.persistence)}` : null,
      "Saved to the application tracker"
    ]);
  }

  return compact([
    run.status === "completed" ? "Step completed successfully" : "Step needs attention",
    run.input_summary || "Workflow step recorded"
  ]);
}

function compact(values: Array<string | null>) {
  const filtered = values.filter((value): value is string => Boolean(value));
  return filtered.length > 0 ? filtered.slice(0, 4) : ["Step completed"];
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : null;
}
