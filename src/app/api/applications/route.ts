import { NextResponse } from "next/server";
import { createSupabaseServerClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ applications: [], persistence: "skipped" });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications: data, persistence: "saved" });
}
