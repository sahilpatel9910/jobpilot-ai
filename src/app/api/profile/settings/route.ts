import { NextResponse } from "next/server";
import {
  buildProfileSummaryFromResume,
  sanitizeCoverLetterPreferences,
  sanitizeProfileSummary
} from "@/lib/profile/profileMemory";
import { createSupabaseServerClient, getCurrentUser, hasSupabaseServerConfig } from "@/lib/supabase/server";

type ProfileSettingsBody = {
  profileSummary?: string;
  coverLetterPreferences?: string;
};

export async function GET() {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to view profile settings." }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profile_settings")
    .select("resume_text, profile_summary, cover_letter_preferences, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profileSummary = data?.profile_summary || (data?.resume_text ? buildProfileSummaryFromResume(data.resume_text) : "");

  return NextResponse.json({
    profile: {
      resumeText: data?.resume_text || "",
      profileSummary,
      coverLetterPreferences: data?.cover_letter_preferences || "",
      updatedAt: data?.updated_at || null
    }
  });
}

export async function PUT(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to update profile settings." }, { status: 401 });
  }

  const body = (await request.json()) as ProfileSettingsBody;
  const profileSummary = sanitizeProfileSummary(body.profileSummary);
  const coverLetterPreferences = sanitizeCoverLetterPreferences(body.coverLetterPreferences);

  if (profileSummary.lengthExceeded) {
    return NextResponse.json({ error: "Profile summary is too long. Please keep it under 4,000 characters." }, { status: 400 });
  }

  if (coverLetterPreferences.lengthExceeded) {
    return NextResponse.json({ error: "Cover letter preferences are too long. Please keep them under 2,000 characters." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data: existingProfile, error: loadError } = await supabase
    .from("profile_settings")
    .select("resume_text")
    .eq("user_id", user.id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("profile_settings")
    .upsert(
      {
        id: user.id,
        user_id: user.id,
        resume_text: existingProfile?.resume_text || "",
        profile_summary: profileSummary.value,
        cover_letter_preferences: coverLetterPreferences.value
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data, persistence: "saved" });
}
