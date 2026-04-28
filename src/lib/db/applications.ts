import type { AgentRunRecord, ApplicationRecord, ApplicationStatusHistoryRecord } from "@/lib/db/types";
import { createSupabaseServerClient, getCurrentUser, hasSupabaseServerConfig } from "@/lib/supabase/server";

export async function listApplications(): Promise<ApplicationRecord[]> {
  if (!hasSupabaseServerConfig()) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as ApplicationRecord[];
}

export async function getApplication(id: string): Promise<ApplicationRecord | null> {
  if (!hasSupabaseServerConfig()) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("applications").select("*").eq("id", id).eq("user_id", user.id).single();

  if (error) return null;
  return data as ApplicationRecord;
}

export async function listApplicationStatusHistory(id: string): Promise<ApplicationStatusHistoryRecord[]> {
  if (!hasSupabaseServerConfig()) return [];
  const application = await getApplication(id);
  if (!application) return [];

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("application_status_history")
    .select("*")
    .eq("application_id", id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as ApplicationStatusHistoryRecord[];
}

export async function listAgentRuns(id: string): Promise<AgentRunRecord[]> {
  if (!hasSupabaseServerConfig()) return [];
  const application = await getApplication(id);
  if (!application) return [];

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("application_id", id)
    .order("started_at", { ascending: true });

  if (error) return [];
  return data as AgentRunRecord[];
}
