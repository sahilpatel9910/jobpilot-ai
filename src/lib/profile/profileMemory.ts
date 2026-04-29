import { sanitizeTextField } from "@/lib/security/inputSanitizer";

export const MAX_PROFILE_SUMMARY_CHARACTERS = 4000;
export const MAX_COVER_LETTER_PREFERENCES_CHARACTERS = 2000;

const SECTION_HEADINGS = [
  "profile",
  "summary",
  "experience",
  "projects",
  "technical skills",
  "skills",
  "education",
  "certifications"
];

export function buildProfileSummaryFromResume(resumeText: string) {
  const sanitized = sanitizeTextField(resumeText, 30000).value;
  const lines = sanitized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const candidateName = findCandidateName(lines);
  const sections = extractSections(lines);
  const summaryParts = [
    candidateName ? `Candidate: ${candidateName}.` : null,
    sectionSnippet(sections.profile || sections.summary, "Profile"),
    sectionSnippet(sections["technical skills"] || sections.skills, "Skills"),
    sectionSnippet(sections.experience, "Experience"),
    sectionSnippet(sections.projects, "Projects"),
    sectionSnippet(sections.education, "Education"),
    sectionSnippet(sections.certifications, "Certifications")
  ].filter(Boolean);

  return summaryParts.join("\n").slice(0, MAX_PROFILE_SUMMARY_CHARACTERS);
}

export function sanitizeProfileSummary(value: unknown) {
  return sanitizeTextField(value, MAX_PROFILE_SUMMARY_CHARACTERS);
}

export function sanitizeCoverLetterPreferences(value: unknown) {
  return sanitizeTextField(value, MAX_COVER_LETTER_PREFERENCES_CHARACTERS);
}

function findCandidateName(lines: string[]) {
  const firstMeaningfulLine = lines.find((line) => {
    const normalized = line.toLowerCase();
    return (
      line.length >= 3 &&
      line.length <= 80 &&
      !normalized.includes("@") &&
      !normalized.includes("linkedin") &&
      !normalized.includes("github") &&
      !SECTION_HEADINGS.includes(normalized)
    );
  });

  return firstMeaningfulLine || "";
}

function extractSections(lines: string[]) {
  const sections: Record<string, string[]> = {};
  let currentSection = "";

  for (const line of lines) {
    const normalized = normalizeHeading(line);
    if (SECTION_HEADINGS.includes(normalized)) {
      currentSection = normalized;
      sections[currentSection] = sections[currentSection] || [];
      continue;
    }

    if (currentSection) {
      sections[currentSection].push(line.replace(/^[-•]\s*/, ""));
    }
  }

  return sections;
}

function normalizeHeading(line: string) {
  return line
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sectionSnippet(lines: string[] | undefined, label: string) {
  if (!lines?.length) return null;
  const meaningful = lines
    .filter((line) => line.length > 8)
    .slice(0, 4)
    .join(" ");

  return meaningful ? `${label}: ${meaningful}` : null;
}
