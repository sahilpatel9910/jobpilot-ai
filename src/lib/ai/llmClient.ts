import type { JobAnalysis, JobIntakeInput } from "@/lib/db/types";
import { buildJobAnalysisPrompt, SYSTEM_PROMPT } from "@/lib/ai/prompts";

type LlmResult = {
  analysis: JobAnalysis;
  mode: "mock" | "llm";
};

export function hasLlmConfig() {
  return Boolean(process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.OLLAMA_BASE_URL);
}

export async function generateAnalysisWithLlm(input: JobIntakeInput): Promise<LlmResult> {
  if (!hasLlmConfig()) {
    return { analysis: createMockAnalysis(input), mode: "mock" };
  }

  const prompt = buildJobAnalysisPrompt(input);

  if (process.env.OPENAI_API_KEY) {
    return {
      analysis: await callOpenAiCompatible({
        baseUrl: "https://api.openai.com/v1/chat/completions",
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        prompt
      }),
      mode: "llm"
    };
  }

  if (process.env.GROQ_API_KEY) {
    return {
      analysis: await callOpenAiCompatible({
        baseUrl: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
        prompt
      }),
      mode: "llm"
    };
  }

  return {
    analysis: await callOllama({
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.OLLAMA_MODEL || "llama3.1",
      prompt
    }),
    mode: "llm"
  };
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
  return parseAnalysisJson(payload.choices?.[0]?.message?.content);
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
  return parseAnalysisJson(payload.message?.content);
}

function parseAnalysisJson(raw: unknown): JobAnalysis {
  if (typeof raw !== "string") {
    throw new Error("LLM response did not include text content.");
  }

  const parsed = JSON.parse(raw) as Partial<JobAnalysis>;
  return {
    summary: String(parsed.summary || ""),
    requiredSkills: asStringArray(parsed.requiredSkills),
    matchScore: clampScore(Number(parsed.matchScore || 0)),
    missingKeywords: asStringArray(parsed.missingKeywords),
    strengths: asStringArray(parsed.strengths),
    gaps: asStringArray(parsed.gaps),
    suggestedBullets: asStringArray(parsed.suggestedBullets),
    coverLetter: String(parsed.coverLetter || "")
  };
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function clampScore(score: number) {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
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
    coverLetter: `Dear Hiring Team,\n\nI am excited to apply for the ${input.jobTitle} role at ${input.companyName}. My experience building practical software projects has strengthened my ability to understand requirements, translate them into clear technical plans, and deliver maintainable features that support real user workflows.\n\nYour role stands out because it calls for a candidate who can combine technical execution with structured problem solving. In my recent work, I have focused on building full-stack applications, designing clean interfaces, and connecting product requirements to reliable implementation. I am comfortable working across frontend and backend concerns, communicating tradeoffs clearly, and improving a product through iterative delivery.\n\nI would bring a hands-on engineering mindset, attention to detail, and a strong bias toward useful outcomes. I am especially interested in contributing to a team where thoughtful product decisions, clean code, and consistent execution matter.\n\nThank you for considering my application. I would welcome the opportunity to discuss how my background and project experience align with the needs of this role.\n\nSincerely,\nSahil Patel`
  };
}
