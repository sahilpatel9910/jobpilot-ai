import type { ApplicationRecord } from "@/lib/db/types";
import { createSupabaseServerClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

export async function listApplications(): Promise<ApplicationRecord[]> {
  if (!hasSupabaseServerConfig()) return [];

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("applications").select("*").order("created_at", { ascending: false });

  if (error) return [];
  return data as ApplicationRecord[];
}

export async function getApplication(id: string): Promise<ApplicationRecord | null> {
  if (!hasSupabaseServerConfig()) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("applications").select("*").eq("id", id).single();

  if (error) return null;
  return data as ApplicationRecord;
}
