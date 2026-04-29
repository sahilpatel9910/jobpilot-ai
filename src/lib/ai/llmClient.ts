import type { JobAnalysis, JobIntakeInput } from "@/lib/db/types";
import type { QualityReviewResult } from "@/lib/ai/agents/qualityReviewAgent";
import { normalizeAnalysis, normalizeCoverLetterResponse } from "@/lib/ai/analysisValidator";
import { buildAnalysisRepairPrompt, buildCoverLetterPrompt, buildJobAnalysisPrompt, SYSTEM_PROMPT } from "@/lib/ai/prompts";

type LlmResult = {
  analysis: JobAnalysis;
  mode: "mock" | "llm";
  provider: LlmProviderName | "mock";
};

type CoverLetterLlmResult = {
  coverLetter: string;
  mode: "mock" | "llm";
  provider: LlmProviderName | "mock";
};

export type LlmProviderName = "anthropic" | "openai" | "groq" | "ollama";

const PROVIDER_ORDER: LlmProviderName[] = ["anthropic", "openai", "groq", "ollama"];

export function hasLlmConfig() {
  return getConfiguredProviders().length > 0;
}

export function getLlmRuntimeStatus() {
  const configuredProviders = getConfiguredProviders();
  const requestedProvider = normalizeProvider(process.env.LLM_PROVIDER);
  const requestedProviderConfigured =
    requestedProvider === "auto" || (requestedProvider ? configuredProviders.includes(requestedProvider) : false);

  return {
    hasLlmConfig: configuredProviders.length > 0,
    mode: configuredProviders.length > 0 ? "llm-capable" : "mock",
    configuredProviders,
    requestedProvider: requestedProvider || "invalid",
    requestedProviderConfigured,
    providerOrder: PROVIDER_ORDER
  };
}

export async function generateAnalysisWithLlm(input: JobIntakeInput): Promise<LlmResult> {
  if (!hasLlmConfig()) {
    return { analysis: createMockAnalysis(input), mode: "mock", provider: "mock" };
  }

  const prompt = buildJobAnalysisPrompt(input);
  const providers = getProvidersToTry();
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      return {
        analysis: normalizeAnalysis(await callProvider(provider, prompt)),
        mode: "llm",
        provider
      };
    } catch (error) {
      errors.push(`${provider}: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  throw new Error(`All configured LLM providers failed. ${errors.join(" | ")}`);
}

export async function repairAnalysisWithLlm({
  input,
  analysis,
  review,
  provider
}: {
  input: JobIntakeInput;
  analysis: JobAnalysis;
  review: QualityReviewResult;
  provider: LlmProviderName;
}) {
  const prompt = buildAnalysisRepairPrompt(input, analysis, review);
  return normalizeAnalysis(await callProvider(provider, prompt));
}

export async function generateCoverLetterWithLlm({
  input,
  analysis,
  context,
  profileSummary,
  coverLetterPreferences,
  previousCoverLetter,
  revisionInstruction
}: {
  input: JobIntakeInput;
  analysis: JobAnalysis;
  context?: string;
  profileSummary?: string;
  coverLetterPreferences?: string;
  previousCoverLetter?: string;
  revisionInstruction?: string;
}): Promise<CoverLetterLlmResult> {
  if (!hasLlmConfig()) {
    return {
      coverLetter: createMockCoverLetter(input, analysis, context, revisionInstruction),
      mode: "mock",
      provider: "mock"
    };
  }

  const prompt = buildCoverLetterPrompt({
    input,
    analysis,
    context,
    profileSummary,
    coverLetterPreferences,
    previousCoverLetter,
    revisionInstruction
  });
  const providers = getProvidersToTry();
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      return {
        coverLetter: normalizeCoverLetterResponse(await callProvider(provider, prompt)),
        mode: "llm",
        provider
      };
    } catch (error) {
      errors.push(`${provider}: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  throw new Error(`All configured LLM providers failed. ${errors.join(" | ")}`);
}

function getConfiguredProviders() {
  return PROVIDER_ORDER.filter((provider) => {
    if (provider === "anthropic") return Boolean(process.env.ANTHROPIC_API_KEY);
    if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
    if (provider === "groq") return Boolean(process.env.GROQ_API_KEY);
    return Boolean(process.env.OLLAMA_BASE_URL);
  });
}

function getProvidersToTry() {
  const configured = getConfiguredProviders();
  const requested = normalizeProvider(process.env.LLM_PROVIDER);

  if (!requested) {
    throw new Error(`Unsupported LLM_PROVIDER "${process.env.LLM_PROVIDER}". Use auto, anthropic, openai, groq, or ollama.`);
  }

  if (requested === "auto") {
    return configured;
  }

  if (!configured.includes(requested)) {
    throw new Error(`LLM_PROVIDER is set to "${requested}", but that provider is not configured.`);
  }

  return [requested];
}

function normalizeProvider(value: string | undefined): LlmProviderName | "auto" | null {
  if (!value) return "auto";
  const normalized = value.trim().toLowerCase();
  if (normalized === "auto") return "auto";
  if (normalized === "claude" || normalized === "anthropic") return "anthropic";
  if (normalized === "openai" || normalized === "gpt") return "openai";
  if (normalized === "groq") return "groq";
  if (normalized === "ollama" || normalized === "local") return "ollama";
  return null;
}

async function callProvider(provider: LlmProviderName, prompt: string) {
  if (provider === "anthropic") {
    return callAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      prompt
    });
  }

  if (provider === "openai") {
    return callOpenAiCompatible({
      baseUrl: "https://api.openai.com/v1/chat/completions",
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      prompt
    });
  }

  if (provider === "groq") {
    return callOpenAiCompatible({
      baseUrl: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY || "",
      model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
      prompt
    });
  }

  return callOllama({
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.OLLAMA_MODEL || "llama3.1",
      prompt
  });
}

async function callAnthropic({
  apiKey,
  model,
  prompt
}: {
  apiKey: string;
  model: string;
  prompt: string;
}) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const text = Array.isArray(payload.content)
    ? payload.content.find((part: { type?: string; text?: string }) => part.type === "text")?.text
    : null;

  return text || "";
}

async function callOpenAiCompatible({
  baseUrl,
  apiKey,
  model,
  prompt
}: {
  baseUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
}) {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return String(payload.choices?.[0]?.message?.content || "");
}

async function callOllama({
  baseUrl,
  model,
  prompt
}: {
  baseUrl: string;
  model: string;
  prompt: string;
}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      format: "json",
      options: { temperature: 0.3 }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return String(payload.message?.content || "");
}

export function createMockAnalysis(input: JobIntakeInput): JobAnalysis {
  const text = `${input.jobDescription} ${input.resumeText}`.toLowerCase();
  const keywords = ["typescript", "react", "next.js", "supabase", "sql", "api", "testing", "automation", "ai"];
  const present = keywords.filter((keyword) => text.includes(keyword.replace(".js", "")));
  const missing = keywords.filter((keyword) => !input.resumeText.toLowerCase().includes(keyword.replace(".js", "")));

  return {
    summary: `${input.companyName} is hiring for a ${input.jobTitle} role that appears to value product engineering, structured execution, and practical delivery against business requirements.`,
    requiredSkills: present.length > 0 ? present : ["communication", "problem solving", "software delivery", "stakeholder collaboration"],
    matchScore: Math.min(88, Math.max(58, 62 + present.length * 4 - missing.length)),
    missingKeywords: missing.slice(0, 7),
    strengths: [
      "Resume shows relevant delivery experience and measurable project ownership.",
      "Technical project work can be positioned clearly against the role requirements.",
      "Candidate narrative supports a practical, outcome-focused application."
    ],
    gaps: [
      "Some job-description keywords are not explicitly mirrored in the resume text.",
      "Impact metrics could be made more prominent in the most relevant bullets.",
      "Role-specific tools should be surfaced earlier if they match real experience."
    ],
    suggestedBullets: [
      `Tailored ${input.jobTitle.toLowerCase()} experience by mapping product requirements into scoped technical deliverables using modern web tooling.`,
      "Improved project clarity by documenting workflows, implementation decisions, and measurable outcomes for stakeholders.",
      "Built user-facing features with attention to reliability, maintainability, and clean handoff between frontend and backend services."
    ],
    coverLetter: ""
  };
}

function createMockCoverLetter(
  input: JobIntakeInput,
  analysis: JobAnalysis,
  context?: string,
  revisionInstruction?: string
) {
  const contextSentence = context
    ? "I have also considered the additional context provided around role fit and can position that carefully without overstating unsupported experience."
    : "The analysis highlights a practical fit across the role requirements and my current project experience.";
  const revisionSentence = revisionInstruction
    ? "I have adjusted the draft to reflect the requested tone and emphasis while keeping the claims grounded."
    : "This draft keeps the tone professional, confident, and grounded in the resume.";

  return `Dear Hiring Team,

I am applying for the ${input.jobTitle} role at ${input.companyName} because my recent full-stack project work aligns closely with the practical delivery, communication, and technical ownership reflected in the job description. My background includes building user-facing workflows, connecting frontend and backend services, and documenting implementation decisions so projects remain maintainable.

The strongest areas of fit are ${analysis.strengths.slice(0, 2).join(" ")} I can bring this same structured approach to the responsibilities in this role, especially where the team needs someone who can translate requirements into clean, reliable software. ${contextSentence}

I also see clear areas to tailor my resume and discussion points around the role. The missing or weaker keywords identified in the analysis include ${analysis.missingKeywords.slice(0, 4).join(", ") || "role-specific tooling"}, and I would position those honestly through related project evidence rather than overclaiming. ${revisionSentence}

I can bring practical full-stack delivery, clear communication, and grounded problem-solving to the team from day one.

Thank you,

Warm regards,
Sahil Patel`;
}
