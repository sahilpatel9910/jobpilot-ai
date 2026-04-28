import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser, hasSupabaseServerConfig } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ history: [], persistence: "skipped" });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to view status history." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (applicationError || !application) {
    return NextResponse.json({ error: "Application was not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("application_status_history")
    .select("*")
    .eq("application_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ history: data, persistence: "saved" });
}
