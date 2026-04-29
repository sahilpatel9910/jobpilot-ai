import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";
import { buildProfileSummaryFromResume } from "@/lib/profile/profileMemory";
import { createSupabaseServerClient, getCurrentUser, hasSupabaseServerConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await loadProfileSettings(user.id);
  const profileSummary = profile?.profile_summary || (profile?.resume_text ? buildProfileSummaryFromResume(profile.resume_text) : "");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-pilot-700">Profile memory</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Personal settings</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          JobPilot stores a private summary of your background and cover-letter preferences. This is retrieval context
          for future generations, not model training.
        </p>
      </div>

      <ProfileSettingsForm
        initialProfileSummary={profileSummary}
        initialCoverLetterPreferences={profile?.cover_letter_preferences || ""}
        hasResume={Boolean(profile?.resume_text)}
      />
    </div>
  );
}

async function loadProfileSettings(userId: string) {
  if (!hasSupabaseServerConfig()) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profile_settings")
    .select("resume_text, profile_summary, cover_letter_preferences")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return null;
  return data;
}
