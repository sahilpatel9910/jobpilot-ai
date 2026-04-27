import type { JobAnalysis } from "@/lib/db/types";

const MIN_COVER_LETTER_WORDS = 180;
const MAX_COVER_LETTER_WORDS = 380;
const PERCENT_PATTERN = /\b\d{1,3}\s?%\b|\b\d{1,3}\s?\/\s?100\b/g;

export function normalizeAnalysis(raw: unknown): JobAnalysis {
  const parsed = parseRawAnalysis(raw);
  const matchScore = clampScore(Number(parsed.matchScore));
  const summary = normalizeSummary(String(parsed.summary || ""), matchScore);

  const analysis: JobAnalysis = {
    summary,
    requiredSkills: requiredList(parsed.requiredSkills, "requiredSkills"),
    matchScore,
    missingKeywords: optionalList(parsed.missingKeywords),
    strengths: requiredList(parsed.strengths, "strengths"),
    gaps: requiredList(parsed.gaps, "gaps"),
    suggestedBullets: requiredList(parsed.suggestedBullets, "suggestedBullets"),
    coverLetter: normalizeCoverLetter(String(parsed.coverLetter || ""))
  };

  validateAnalysis(analysis);
  return analysis;
}

function parseRawAnalysis(raw: unknown): Partial<JobAnalysis> {
  if (typeof raw !== "string") {
    throw new Error("LLM response did not include text content.");
  }

  const trimmed = stripCodeFence(raw.trim());
  const jsonText = extractJsonObject(trimmed);

  try {
    return JSON.parse(jsonText) as Partial<JobAnalysis>;
  } catch {
    throw new Error("LLM response was not valid JSON.");
  }
}

function stripCodeFence(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractJsonObject(value: string) {
  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("LLM response did not contain a JSON object.");
  }

  return value.slice(firstBrace, lastBrace + 1);
}

function requiredList(value: unknown, field: keyof JobAnalysis) {
  const list = optionalList(value);
  if (list.length === 0) {
    throw new Error(`LLM response missing required field: ${field}.`);
  }
  return list;
}

function optionalList(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 12);
}

function clampScore(score: number) {
  if (Number.isNaN(score)) {
    throw new Error("LLM response included an invalid matchScore.");
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeSummary(summary: string, matchScore: number) {
  const cleaned = summary.trim().replace(PERCENT_PATTERN, `${matchScore}/100`);

  if (cleaned.length < 40) {
    throw new Error("LLM response summary was too short.");
  }

  return cleaned;
}

function normalizeCoverLetter(coverLetter: string) {
  const cleaned = coverLetter.trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length > MAX_COVER_LETTER_WORDS) {
    return `${words.slice(0, 350).join(" ")}.`;
  }

  return cleaned;
}

function validateAnalysis(analysis: JobAnalysis) {
  if (analysis.matchScore < 0 || analysis.matchScore > 100) {
    throw new Error("LLM response matchScore must be between 0 and 100.");
  }

  if (analysis.coverLetter.split(/\s+/).filter(Boolean).length < MIN_COVER_LETTER_WORDS) {
    throw new Error("LLM response cover letter was too short.");
  }

  if (!analysis.summary || !analysis.coverLetter) {
    throw new Error("LLM response missing summary or cover letter.");
  }
}

export function toUserFacingLlmError(error: unknown) {
  const message = error instanceof Error ? error.message : "The AI provider failed.";

  if (message.includes("status 401") || message.includes("status 403")) {
    return "The selected AI provider rejected the API key. Check the key and provider settings in .env.local.";
  }

  if (message.includes("status 429")) {
    return "The selected AI provider is rate-limited or out of quota. Check billing, credits, or usage limits.";
  }

  if (message.includes("not valid JSON") || message.includes("missing required field") || message.includes("too short")) {
    return "The AI provider returned an incomplete response. Try again, or switch providers if it continues.";
  }

  if (message.includes("LLM_PROVIDER")) {
    return message;
  }

  return "The AI analysis failed. Check your provider key, model name, and quota, then try again.";
}
