import { NextResponse } from "next/server";
import { createSupabaseServerClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ agentRuns: [], persistence: "skipped" });
  }

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("application_id", id)
    .order("started_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ agentRuns: data, persistence: "saved" });
}
