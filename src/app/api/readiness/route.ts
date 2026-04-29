import { NextResponse } from "next/server";
import { getLlmRuntimeStatus } from "@/lib/ai/llmClient";
import { createSupabaseServerClient, hasSupabaseAuthConfig, hasSupabaseServerConfig } from "@/lib/supabase/server";

type ReadinessCheck = {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
};

export async function GET() {
  const checks: ReadinessCheck[] = [];
  const hasAuthConfig = hasSupabaseAuthConfig();
  const hasServerConfig = hasSupabaseServerConfig();
  const llm = getLlmRuntimeStatus();

  checks.push({
    name: "Supabase auth environment",
    status: hasAuthConfig ? "pass" : "fail",
    message: hasAuthConfig
      ? "Public Supabase URL and anon key are configured."
      : "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
  });

  checks.push({
    name: "Supabase server environment",
    status: hasServerConfig ? "pass" : "fail",
    message: hasServerConfig
      ? "Supabase service role key is configured server-side."
      : "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
  });

  checks.push({
    name: "LLM provider",
    status: llm.hasLlmConfig && llm.requestedProviderConfigured ? "pass" : llm.hasLlmConfig ? "fail" : "warn",
    message: llm.hasLlmConfig
      ? llm.requestedProviderConfigured
        ? `Configured providers: ${llm.configuredProviders.join(", ")}.`
        : `LLM_PROVIDER is "${llm.requestedProvider}", but that provider is not configured.`
      : "No LLM provider is configured. The app will use deterministic mock mode."
  });

  if (hasServerConfig) {
    checks.push(await checkSupabaseSchema());
  }

  const ok = checks.every((check) => check.status !== "fail");

  return NextResponse.json(
    {
      ok,
      checkedAt: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      aiMode: llm.mode,
      checks
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

async function checkSupabaseSchema(): Promise<ReadinessCheck> {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("applications").select("id", { count: "exact", head: true });

    if (error) {
      return {
        name: "Supabase schema",
        status: "fail",
        message: `Could not read applications table. Run supabase/schema.sql. Error: ${error.message}`
      };
    }

    return {
      name: "Supabase schema",
      status: "pass",
      message: "Applications table is reachable with the server client."
    };
  } catch (error) {
    return {
      name: "Supabase schema",
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown Supabase schema check failure."
    };
  }
}
