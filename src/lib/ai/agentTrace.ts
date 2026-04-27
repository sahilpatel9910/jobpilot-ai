import { createSupabaseServerClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

export type AgentTraceEntry = {
  agentName: string;
  inputSummary: string;
  output: Record<string, unknown>;
  startedAt: string;
  completedAt: string;
  status: "completed" | "failed";
};

export function createAgentTrace(
  agentName: string,
  inputSummary: string,
  output: Record<string, unknown>,
  status: "completed" | "failed" = "completed"
): AgentTraceEntry {
  const timestamp = new Date().toISOString();

  return {
    agentName,
    inputSummary,
    output,
    startedAt: timestamp,
    completedAt: timestamp,
    status
  };
}

export async function persistAgentTrace(applicationId: string, traces: AgentTraceEntry[]) {
  if (!hasSupabaseServerConfig() || traces.length === 0) return;

  const supabase = createSupabaseServerClient();
  await supabase.from("agent_runs").insert(
    traces.map((trace) => ({
      application_id: applicationId,
      agent_name: trace.agentName,
      input_summary: trace.inputSummary,
      output: trace.output,
      status: trace.status,
      started_at: trace.startedAt,
      completed_at: trace.completedAt
    }))
  );
}
