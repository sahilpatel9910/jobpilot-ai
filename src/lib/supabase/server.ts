import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type User } from "@supabase/supabase-js";
import type {
  ApplicationRecord,
  ApplicationStatus,
  ApplicationStatusHistoryRecord,
  AgentRunRecord,
  AgentRunStatus,
  ProfileSettingsRecord
} from "@/lib/db/types";

type ApplicationInsert = {
  user_id: string;
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
  cover_letter_context?: string | null;
  cover_letter_revision_instruction?: string | null;
  cover_letter_generated_at?: string | null;
  cover_letter_status?: "not_generated" | "generated" | "regenerated";
  notes?: string | null;
};

type ApplicationUpdate = Partial<ApplicationInsert>;

type ProfileSettingsInsert = {
  id?: string;
  user_id: string;
  resume_text: string;
  profile_summary?: string | null;
  cover_letter_preferences?: string | null;
};

type ProfileSettingsUpdate = Partial<ProfileSettingsInsert>;

type ApplicationStatusHistoryInsert = {
  application_id: string;
  from_status?: ApplicationStatus | null;
  to_status: ApplicationStatus;
  note?: string | null;
};

type AgentRunInsert = {
  application_id: string;
  agent_name: string;
  input_summary?: string | null;
  output: Record<string, unknown>;
  status: AgentRunStatus;
  started_at?: string;
  completed_at?: string | null;
};

type Database = {
  public: {
    Tables: {
      applications: {
        Row: ApplicationRecord;
        Insert: ApplicationInsert;
        Update: ApplicationUpdate;
        Relationships: [];
      };
      profile_settings: {
        Row: ProfileSettingsRecord;
        Insert: ProfileSettingsInsert;
        Update: ProfileSettingsUpdate;
        Relationships: [];
      };
      application_status_history: {
        Row: ApplicationStatusHistoryRecord;
        Insert: ApplicationStatusHistoryInsert;
        Update: Partial<ApplicationStatusHistoryInsert>;
        Relationships: [];
      };
      agent_runs: {
        Row: AgentRunRecord;
        Insert: AgentRunInsert;
        Update: Partial<AgentRunInsert>;
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

export function hasSupabaseAuthConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function createSupabaseAuthServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase auth environment variables.");
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always set cookies. Route Handlers can.
        }
      }
    }
  });
}

export async function getCurrentUser(): Promise<User | null> {
  if (!hasSupabaseAuthConfig()) return null;

  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) return null;
  return data.user;
}
