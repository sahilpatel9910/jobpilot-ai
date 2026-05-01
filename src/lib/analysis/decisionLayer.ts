import type { JobAnalysis, JobIntakeInput } from "@/lib/db/types";

export type ApplicationDecision = "Recommended" | "Risky" | "Not Recommended";
export type DecisionConfidence = "Low" | "Medium" | "High";

export type DecisionRecommendation = {
  decision: ApplicationDecision;
  confidence: DecisionConfidence;
  reason: string;
  domainMismatch: boolean;
  resumeDomain: string;
  jobDomain: string;
  alternativeRoles: string[];
};

export type AtsKeywordIntelligence = {
  matchPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  weakTransferableKeywords: string[];
  irrelevantResumeKeywords: string[];
};

export type AnalysisDecisionResult = {
  recommendation: DecisionRecommendation;
  ats: AtsKeywordIntelligence;
};

type DomainProfile = {
  label: string;
  keywords: string[];
  alternativeRoles: string[];
};

const domainProfiles: DomainProfile[] = [
  {
    label: "Software Engineering / AI",
    keywords: [
      "software engineer",
      "full-stack",
      "full stack",
      "frontend",
      "backend",
      "developer",
      "react",
      "next.js",
      "typescript",
      "javascript",
      "node.js",
      "api",
      "apis",
      "postgresql",
      "supabase",
      "prisma",
      "aws",
      "vercel",
      "llm",
      "ai",
      "claude",
      "openai",
      "groq",
      "rag",
      "langgraph",
      "docker",
      "ci/cd"
    ],
    alternativeRoles: [
      "Full Stack Developer",
      "Software Engineer",
      "AI Engineer",
      "Backend Developer",
      "Frontend Developer",
      "Technical Project Coordinator"
    ]
  },
  {
    label: "Architecture / Construction",
    keywords: [
      "architect",
      "architecture",
      "revit",
      "autocad",
      "construction",
      "building code",
      "building codes",
      "registered architect",
      "design documentation",
      "planning permit",
      "construction documentation",
      "site inspection",
      "bca",
      "ncc",
      "cad",
      "interior design",
      "urban design"
    ],
    alternativeRoles: ["Graduate Architect", "Architectural Technician", "Revit Documenter", "Project Architect"]
  },
  {
    label: "Hospitality / Retail",
    keywords: ["retail", "hospitality", "customer service", "pos", "barista", "restaurant", "store", "sales assistant"],
    alternativeRoles: ["Customer Support Specialist", "Retail Operations Coordinator", "POS Support Analyst"]
  },
  {
    label: "Healthcare / Clinical",
    keywords: ["clinical", "healthcare", "patient", "nursing", "pharmacy", "medical", "allied health"],
    alternativeRoles: ["Healthcare Systems Analyst", "Clinical Software Support", "HealthTech Support Engineer"]
  }
];

const transferableKeywordPairs = [
  ["documentation", "documentation"],
  ["stakeholder", "stakeholder management"],
  ["client", "client communication"],
  ["communication", "communication"],
  ["coordination", "project coordination"],
  ["project", "project coordination"],
  ["requirements", "requirements gathering"],
  ["quality", "quality assurance"],
  ["testing", "testing"],
  ["workflow", "workflow analysis"]
] as const;

export function evaluateAnalysisDecision(input: JobIntakeInput, analysis: JobAnalysis): AnalysisDecisionResult {
  const resumeText = normalize(input.resumeText);
  const jobText = normalize(`${input.jobTitle} ${input.companyName} ${input.jobDescription} ${analysis.requiredSkills.join(" ")}`);
  const resumeDomain = detectDomain(resumeText);
  const jobDomain = detectDomain(jobText);
  const domainMismatch = isDomainMismatch(resumeDomain, jobDomain, analysis.matchScore);
  const decision = chooseDecision(analysis.matchScore, domainMismatch);
  const ats = buildAtsKeywordIntelligence(input, analysis);

  return {
    recommendation: {
      decision,
      confidence: decision === "Not Recommended" && domainMismatch ? "High" : analysis.matchScore > 70 ? "High" : "Medium",
      reason: buildDecisionReason(decision, domainMismatch, resumeDomain.label, jobDomain.label, analysis.matchScore),
      domainMismatch,
      resumeDomain: resumeDomain.label,
      jobDomain: jobDomain.label,
      alternativeRoles: resumeDomain.profile?.alternativeRoles || defaultAlternativeRoles
    },
    ats
  };
}

function detectDomain(text: string) {
  const scored = domainProfiles
    .map((profile) => ({
      profile,
      label: profile.label,
      score: profile.keywords.reduce((total, keyword) => total + countKeyword(text, keyword), 0)
    }))
    .sort((left, right) => right.score - left.score);

  const best = scored[0];
  if (!best || best.score < 2) {
    return { label: "General / Unclear", score: best?.score || 0, profile: null };
  }

  return { label: best.label, score: best.score, profile: best.profile };
}

function isDomainMismatch(
  resumeDomain: { label: string; score: number },
  jobDomain: { label: string; score: number },
  matchScore: number
) {
  if (resumeDomain.label === "General / Unclear" || jobDomain.label === "General / Unclear") return false;
  if (resumeDomain.label === jobDomain.label) return false;
  return matchScore < 45 && resumeDomain.score >= 3 && jobDomain.score >= 3;
}

function chooseDecision(matchScore: number, domainMismatch: boolean): ApplicationDecision {
  if (matchScore < 30 && domainMismatch) return "Not Recommended";
  if (matchScore >= 30 && matchScore <= 60) return "Risky";
  if (matchScore > 60) return "Recommended";
  return "Risky";
}

function buildDecisionReason(
  decision: ApplicationDecision,
  domainMismatch: boolean,
  resumeDomain: string,
  jobDomain: string,
  matchScore: number
) {
  if (decision === "Not Recommended" && domainMismatch) {
    return `This job is in ${jobDomain}, while the resume is aligned with ${resumeDomain}.`;
  }

  if (decision === "Risky") {
    return matchScore < 30
      ? "The match score is very low. Only continue if you have relevant experience not shown in the resume."
      : "The match is moderate. A tailored application may work, but the resume needs stronger evidence for this role.";
  }

  return "The resume shows enough relevant evidence to justify a tailored application.";
}

function buildAtsKeywordIntelligence(input: JobIntakeInput, analysis: JobAnalysis): AtsKeywordIntelligence {
  const resumeText = normalize(input.resumeText);
  const jobText = normalize(`${input.jobTitle} ${input.jobDescription}`);
  const requiredTerms = uniqueTerms([...analysis.requiredSkills, ...analysis.missingKeywords]);
  const matchedKeywords = requiredTerms.filter((term) => termAppears(resumeText, term)).slice(0, 12);
  const missingKeywords = uniqueTerms(analysis.missingKeywords.length ? analysis.missingKeywords : requiredTerms)
    .filter((term) => !termAppears(resumeText, term))
    .slice(0, 12);
  const weakTransferableKeywords = transferableKeywordPairs
    .filter(([resumeSignal]) => resumeText.includes(resumeSignal) && jobText.includes(resumeSignal))
    .map(([, jobLabel]) => jobLabel)
    .filter(unique)
    .slice(0, 8);
  const irrelevantResumeKeywords = collectIrrelevantResumeKeywords(input.resumeText, jobText).slice(0, 10);
  const denominator = Math.max(1, matchedKeywords.length + missingKeywords.length);

  return {
    matchPercentage: Math.round((matchedKeywords.length / denominator) * 100),
    matchedKeywords,
    missingKeywords,
    weakTransferableKeywords,
    irrelevantResumeKeywords
  };
}

function collectIrrelevantResumeKeywords(resumeText: string, jobText: string) {
  const normalizedResume = normalize(resumeText);
  const softwareProfile = domainProfiles[0];

  return softwareProfile.keywords
    .filter((keyword) => termAppears(normalizedResume, keyword))
    .filter((keyword) => !termAppears(jobText, keyword))
    .map(toDisplayKeyword)
    .filter(unique);
}

function uniqueTerms(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).filter(unique);
}

function unique(value: string, index: number, values: string[]) {
  return values.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index;
}

function countKeyword(text: string, keyword: string) {
  const pattern = new RegExp(`\\b${escapeRegExp(normalize(keyword))}\\b`, "g");
  return text.match(pattern)?.length || 0;
}

function termAppears(text: string, term: string) {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;

  if (normalizedTerm.length <= 4) {
    return new RegExp(`\\b${escapeRegExp(normalizedTerm)}\\b`).test(text);
  }

  return text.includes(normalizedTerm);
}

function toDisplayKeyword(keyword: string) {
  const displayMap: Record<string, string> = {
    "next.js": "Next.js",
    "node.js": "Node.js",
    typescript: "TypeScript",
    javascript: "JavaScript",
    postgresql: "PostgreSQL",
    supabase: "Supabase",
    prisma: "Prisma",
    claude: "Claude API",
    openai: "OpenAI",
    groq: "Groq",
    rag: "RAG pipelines",
    langgraph: "LangGraph",
    "ci/cd": "CI/CD"
  };

  return displayMap[keyword.toLowerCase()] || keyword;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^\w\s.+/#-]/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const defaultAlternativeRoles = [
  "Full Stack Developer",
  "Software Engineer",
  "Backend Developer",
  "Frontend Developer",
  "Technical Project Coordinator"
];
