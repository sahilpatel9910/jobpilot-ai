import { createClient } from "@supabase/supabase-js";
import type { ApplicationRecord, ApplicationStatus } from "@/lib/db/types";

type ApplicationInsert = {
  company_name: string;
  job_title: string;
  job_url?: string | null;
  job_description: string;
  resume_text: string;
  status?: ApplicationStatus;
  match_score?: number | null;
  summary?: string | null;
  required_skills?: string[];
  strengths?: string[];
  gaps?: string[];
  missing_keywords?: string[];
  suggested_bullets?: string[];
  cover_letter?: string | null;
};

type ApplicationUpdate = Partial<ApplicationInsert>;

type Database = {
  public: {
    Tables: {
      applications: {
        Row: ApplicationRecord;
        Insert: ApplicationInsert;
        Update: ApplicationUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
