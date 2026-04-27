import { NextResponse } from "next/server";
import { createSupabaseServerClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

const PROFILE_ID = "default";

export async function GET() {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ resumeText: "", persistence: "skipped" });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profile_settings")
    .select("resume_text")
    .eq("id", PROFILE_ID)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ resumeText: data?.resume_text || "", persistence: "saved" });
}

export async function PUT(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 400 });
  }

  const body = (await request.json()) as { resumeText?: string };
  const resumeText = body.resumeText?.trim();

  if (!resumeText) {
    return NextResponse.json({ error: "Resume text is required." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profile_settings")
    .upsert({ id: PROFILE_ID, resume_text: resumeText }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data, persistence: "saved" });
}
