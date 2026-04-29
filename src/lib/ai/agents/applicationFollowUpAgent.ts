import type { ApplicationRecord, ApplicationStatusHistoryRecord } from "@/lib/db/types";

export type FollowUpRecommendation = {
  title: string;
  description: string;
  urgency: "low" | "medium" | "high";
  href: string;
  cta: string;
  checklist: string[];
};

export function applicationFollowUpAgent(
  application: ApplicationRecord,
  history: ApplicationStatusHistoryRecord[] = []
): FollowUpRecommendation {
  const daysSinceCreated = daysBetween(application.created_at, new Date().toISOString());
  const daysSinceStatusChange = history[0]?.created_at ? daysBetween(history[0].created_at, new Date().toISOString()) : daysSinceCreated;
  const hasCoverLetter = application.cover_letter_status !== "not_generated" && Boolean(application.cover_letter);

  if (!hasCoverLetter) {
    return {
      title: "Generate the tailored cover letter",
      description: "Review the gaps, add any missing context, then generate a letter grounded in this resume and job ad.",
      urgency: "high",
      href: "#cover-letter",
      cta: "Go to cover letter",
      checklist: ["Review listed gaps", "Add context for any incorrect gap", "Generate and copy the tailored draft"]
    };
  }

  if (application.status === "Analysed" && daysSinceCreated >= 5) {
    return {
      title: "Decide whether to apply or archive",
      description: `This role has been analysed for ${daysSinceCreated} days. Move it forward while the context is fresh, or archive it if it is no longer worth pursuing.`,
      urgency: "high",
      href: "#tracking",
      cta: "Update status",
      checklist: ["Review match score and gaps", "Apply with the saved cover letter", "Set status to Applied or Archived"]
    };
  }

  if (application.status === "Applied") {
    return {
      title: daysSinceStatusChange >= 7 ? "Follow up on this application" : "Record the follow-up plan",
      description:
        daysSinceStatusChange >= 7
          ? `It has been ${daysSinceStatusChange} days since this was marked Applied. Add a follow-up note or move it forward if you have a response.`
          : "Add where you applied, recruiter details, and the date you want to follow up.",
      urgency: daysSinceStatusChange >= 7 ? "high" : "medium",
      href: "#tracking",
      cta: "Add tracking note",
      checklist: ["Record application channel", "Add recruiter/contact details if known", "Set a follow-up date"]
    };
  }

  if (application.status === "Interview") {
    return {
      title: "Prepare interview notes",
      description: "Use the job analysis to capture likely topics, questions to practise, and evidence you want to mention.",
      urgency: "high",
      href: "#tracking",
      cta: "Prepare notes",
      checklist: ["Review strengths and gaps", "Prepare project stories", "Write questions for the interviewer"]
    };
  }

  if (application.status === "Rejected") {
    return {
      title: "Capture the lesson before archiving",
      description: "Save any feedback or pattern you noticed, then archive the application when you are finished with it.",
      urgency: "medium",
      href: "#tracking",
      cta: "Add lesson",
      checklist: ["Record feedback", "Note resume or interview improvements", "Archive when complete"]
    };
  }

  if (application.status === "Offer") {
    return {
      title: "Track offer details",
      description: "Add compensation, deadline, contacts, and negotiation notes so the decision stays organised.",
      urgency: "high",
      href: "#tracking",
      cta: "Add offer notes",
      checklist: ["Record deadline", "Compare offer details", "List open questions"]
    };
  }

  return {
    title: "Move this application forward",
    description: "Use the analysis, resume bullets, cover letter, and status notes to decide the next concrete step.",
    urgency: "low",
    href: "#analysis",
    cta: "Review analysis",
    checklist: ["Review analysis", "Generate or refine cover letter", "Update application status"]
  };
}

function daysBetween(fromIso: string, toIso: string) {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.max(0, Math.floor((to - from) / 86_400_000));
}
