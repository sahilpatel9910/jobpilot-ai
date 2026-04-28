import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser, hasSupabaseServerConfig } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ applications: [], persistence: "skipped" });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to view applications." }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications: data, persistence: "saved" });
}
