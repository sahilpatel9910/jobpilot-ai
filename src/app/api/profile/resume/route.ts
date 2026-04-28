import { NextResponse } from "next/server";
import { classifyInputText, countWords } from "@/lib/security/inputClassifier";
import { MAX_RESUME_CHARACTERS, sanitizeTextField } from "@/lib/security/inputSanitizer";
import { createSupabaseServerClient, getCurrentUser, hasSupabaseServerConfig } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ resumeText: "", persistence: "skipped" });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to load your resume." }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profile_settings")
    .select("resume_text")
    .eq("user_id", user.id)
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
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to save your resume." }, { status: 401 });
  }

  const body = (await request.json()) as { resumeText?: string };
  const sanitized = sanitizeTextField(body.resumeText, MAX_RESUME_CHARACTERS);
  const resumeText = sanitized.value;

  if (!resumeText) {
    return NextResponse.json({ error: "Resume text is required." }, { status: 400 });
  }

  if (sanitized.lengthExceeded) {
    return NextResponse.json({ error: "Resume text is too long. Please keep it under 30,000 characters." }, { status: 400 });
  }

  if (countWords(resumeText) < 40) {
    return NextResponse.json(
      { error: "This does not look like a complete resume. Please paste your resume with skills, projects, experience, or education." },
      { status: 400 }
    );
  }

  const classification = classifyInputText(resumeText);
  if (classification.classification === "job_description" || classification.classification === "invalid") {
    return NextResponse.json({ error: "This does not look like a resume. Please paste your resume in the resume field." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profile_settings")
    .upsert({ id: user.id, user_id: user.id, resume_text: resumeText }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data, persistence: "saved" });
}
