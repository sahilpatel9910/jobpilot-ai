import { evaluateAnalysisDecision } from "@/lib/analysis/decisionLayer";
import type { JobAnalysis, JobIntakeInput } from "@/lib/db/types";

type DecisionTest = {
  name: string;
  input: JobIntakeInput;
  analysis: JobAnalysis;
  expectedDecision: "Recommended" | "Risky" | "Not Recommended";
  expectedMismatch: boolean;
  expectedCriticalMissing: boolean;
  expectedMatchedKeywords?: string[];
  expectedMissingKeywords?: string[];
};

const softwareResume = `
Sahil Patel
Full-Stack Software Engineer
React, Next.js, TypeScript, Node.js, Supabase, PostgreSQL, Claude API, OpenAI, LangGraph, RAG pipelines.
Built production SaaS applications, REST APIs, dashboards, and AI-assisted workflows.
`;

const architectureJob = `
Senior Architect
We are seeking a registered architect for architecture and construction documentation.
Responsibilities include Revit documentation, AutoCAD drawings, building codes, construction coordination, site inspections, and client presentations.
Requirements: Revit, AutoCAD, NCC/BCA knowledge, registered architect experience, construction documentation, and architecture practice experience.
`;

const softwareJob = `
Full Stack AI Engineer
We are looking for a software engineer with React, Next.js, TypeScript, Node.js, SQL databases, APIs, AI-assisted workflows, and production web application experience.
`;

const platformJob = `
Platform Engineer
We need a platform engineer with Kubernetes orchestration, Terraform infrastructure-as-code, GraphQL API design, Redis caching, observability tooling, and CI/CD automation.
`;

const platformResume = `
Platform Software Engineer
Built internal developer platforms using Kubernetes, Terraform, GraphQL, Redis, observability tooling, OpenTelemetry, Prometheus, Docker, and CI/CD pipelines.
Owned API design, cloud infrastructure, service monitoring, and production release automation.
`;

const supabaseDevopsJob = `
Full-Stack Engineer React Vite Tailwind Supabase DigitalOcean
We are looking for a versatile Full-Stack Engineer to manage and scale a React/Vite/Tailwind application with Supabase infrastructure on DigitalOcean.
Responsibilities include DigitalOcean App Platform or Droplets, Supabase Auth, Database, Storage, PostgreSQL Row Level Security policies, DNS, SSL, CORS, Docker, GitHub Actions CI/CD, and Supabase Edge Functions using Deno TypeScript.
Experience with Lovable, Cursor, v0, Cloudflare WAF, DDoS protection, and self-hosting Supabase via Docker Compose is useful.
`;

const sahilResume = `
Sahil Patel
Full-Stack Software Engineer and AI practitioner with React.js, TypeScript, Tailwind CSS, and Node.js experience.
Projects include JobPilot AI using Next.js, TypeScript, Supabase, Claude API, OpenAI, Groq, and Tailwind CSS.
Built a configurable multi-provider LLM layer with server-side key management and production application tracking persisted to Supabase.
Built StrataHub with Next.js 16, TypeScript, tRPC, PostgreSQL, Supabase, Prisma, Stripe, Docker, and Vercel.
Implemented multi-tenant SaaS portals with 5-level RBAC and building-scoped server-side authorisation on every mutation.
Used Supabase WebSocket CDC, signed Supabase Storage flows, Docker, GitHub Actions, Vercel CI/CD, Node.js, REST APIs, and AWS.
`;

const nurseResume = `
Registered Nurse
AHPRA registration, patient care, medication administration, wound care, aged care, hospital experience, clinical documentation.
`;

const dataResume = `
Data Analyst
SQL, Python, Excel, Power BI, Tableau, dashboards, reporting, stakeholder analysis, data visualization, statistics.
`;

const chefResume = `
Chef and Restaurant Team Leader
Commercial cookery, food safety, kitchen operations, stock control, rostering, restaurant service, customer service.
`;

const nurseJob = `
Registered Nurse
We require a registered nurse with current AHPRA registration, clinical assessment experience, medication administration, patient care, and hospital ward experience.
`;

const civilJob = `
Civil Engineer
We need a civil engineer with an engineering degree, AutoCAD, Australian Standards, infrastructure project delivery, site engineering, and 7+ years of experience.
`;

const cybersecurityJob = `
Cybersecurity Analyst
Seeking a cybersecurity analyst with SIEM monitoring, incident response, vulnerability management, security clearance, and threat investigation experience.
`;

const tests: DecisionTest[] = [
  {
    name: "software resume vs architecture job is not recommended",
    input: createInput("Senior Architect", architectureJob, softwareResume),
    analysis: createAnalysis(15, ["Revit", "AutoCAD", "registered architect", "building codes"]),
    expectedDecision: "Not Recommended",
    expectedMismatch: true,
    expectedCriticalMissing: true
  },
  {
    name: "software resume vs registered nurse job is not recommended",
    input: createInput("Registered Nurse", nurseJob, softwareResume),
    analysis: createAnalysis(12, ["AHPRA registration", "registered nurse", "patient care", "medication administration"]),
    expectedDecision: "Not Recommended",
    expectedMismatch: true,
    expectedCriticalMissing: true
  },
  {
    name: "data resume vs civil engineer job is not recommended",
    input: createInput("Civil Engineer", civilJob, dataResume),
    analysis: createAnalysis(22, ["engineering degree", "AutoCAD", "Australian Standards", "7+ years of experience"]),
    expectedDecision: "Not Recommended",
    expectedMismatch: true,
    expectedCriticalMissing: true
  },
  {
    name: "chef resume vs cybersecurity job is not recommended",
    input: createInput("Cybersecurity Analyst", cybersecurityJob, chefResume),
    analysis: createAnalysis(18, ["SIEM", "incident response", "security clearance", "vulnerability management"]),
    expectedDecision: "Not Recommended",
    expectedMismatch: true,
    expectedCriticalMissing: true
  },
  {
    name: "software resume vs software job is recommended",
    input: createInput("Full Stack AI Engineer", softwareJob, softwareResume),
    analysis: createAnalysis(82, ["accessibility"]),
    expectedDecision: "Recommended",
    expectedMismatch: false,
    expectedCriticalMissing: false
  },
  {
    name: "nursing resume vs nursing job is recommended",
    input: createInput("Registered Nurse", nurseJob, nurseResume),
    analysis: createAnalysis(78, []),
    expectedDecision: "Recommended",
    expectedMismatch: false,
    expectedCriticalMissing: false
  },
  {
    name: "moderate score is risky",
    input: createInput("Frontend Developer", softwareJob, softwareResume),
    analysis: createAnalysis(48, ["testing"]),
    expectedDecision: "Risky",
    expectedMismatch: false,
    expectedCriticalMissing: false
  },
  {
    name: "supabase devops job extracts direct ATS keyword matches",
    input: createInput("Full-Stack Engineer", supabaseDevopsJob, sahilResume),
    analysis: {
      summary: "Strong full-stack fit with Supabase and CI/CD experience, but missing direct DigitalOcean and Edge Function evidence.",
      requiredSkills: [
        "React proficiency",
        "TypeScript expertise",
        "Tailwind CSS experience",
        "Supabase (Auth, Database, Edge Functions)",
        "PostgreSQL and RLS policies",
        "DigitalOcean (App Platform, Droplets)",
        "Docker containerization",
        "GitHub Actions CI/CD"
      ],
      matchScore: 72,
      missingKeywords: ["DigitalOcean", "Row Level Security", "RLS policies", "Edge Functions", "Deno", "App Platform", "Droplets"],
      strengths: ["React, TypeScript, Supabase, Docker, and GitHub Actions experience"],
      gaps: ["No direct DigitalOcean, Deno Edge Functions, or RLS policy evidence"],
      suggestedBullets: ["Deployed containerized applications using Docker with GitHub Actions CI/CD pipelines."],
      coverLetter: ""
    },
    expectedDecision: "Recommended",
    expectedMismatch: false,
    expectedCriticalMissing: false,
    expectedMatchedKeywords: ["React", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Docker", "GitHub Actions", "CI/CD"],
    expectedMissingKeywords: ["DigitalOcean", "RLS policies", "Supabase Edge Functions", "Deno", "App Platform", "Droplets"]
  },
  {
    name: "generic ATS extraction handles uncatalogued platform skills",
    input: createInput("Platform Engineer", platformJob, platformResume),
    analysis: {
      summary: "Strong platform engineering fit with direct infrastructure and API evidence.",
      requiredSkills: [
        "Kubernetes orchestration",
        "Terraform infrastructure-as-code",
        "GraphQL API design",
        "Redis caching",
        "Observability tooling",
        "CI/CD automation"
      ],
      matchScore: 84,
      missingKeywords: ["Helm charts"],
      strengths: ["Kubernetes, Terraform, GraphQL, Redis, observability, and CI/CD experience"],
      gaps: ["No Helm chart evidence"],
      suggestedBullets: ["Built internal developer platforms using Kubernetes, Terraform, GraphQL, Redis, and CI/CD pipelines."],
      coverLetter: ""
    },
    expectedDecision: "Recommended",
    expectedMismatch: false,
    expectedCriticalMissing: false,
    expectedMatchedKeywords: ["Kubernetes", "Terraform", "GraphQL", "Redis", "Observability", "CI/CD"],
    expectedMissingKeywords: []
  }
];

let passed = 0;

for (const test of tests) {
  const result = evaluateAnalysisDecision(test.input, test.analysis);
  const ok =
    result.recommendation.decision === test.expectedDecision &&
    result.recommendation.domainMismatch === test.expectedMismatch &&
    result.recommendation.criticalRequirementMissing === test.expectedCriticalMissing &&
    expectedKeywordsPresent(result.ats.matchedKeywords, test.expectedMatchedKeywords || []) &&
    expectedKeywordsPresent(result.ats.missingKeywords, test.expectedMissingKeywords || []);

  if (ok) {
    passed += 1;
    console.log(`PASS ${test.name}`);
  } else {
    console.error(
      `FAIL ${test.name}: expected ${test.expectedDecision}/${test.expectedMismatch}/${test.expectedCriticalMissing}, got ${result.recommendation.decision}/${result.recommendation.domainMismatch}/${result.recommendation.criticalRequirementMissing}. ATS matched: ${result.ats.matchedKeywords.join(", ") || "none"}. ATS missing: ${result.ats.missingKeywords.join(", ") || "none"}`
    );
  }
}

if (passed !== tests.length) {
  process.exitCode = 1;
}

console.log(`Decision tests: ${passed}/${tests.length} passed`);

function createInput(jobTitle: string, jobDescription: string, resumeText: string): JobIntakeInput {
  return {
    companyName: "Example Company",
    jobTitle,
    jobDescription,
    resumeText
  };
}

function createAnalysis(matchScore: number, missingKeywords: string[]): JobAnalysis {
  return {
    summary: "Test summary",
    requiredSkills: ["React", "TypeScript", ...missingKeywords],
    matchScore,
    missingKeywords,
    strengths: ["Software engineering delivery experience"],
    gaps: ["Domain-specific requirements are missing"],
    suggestedBullets: ["Built production software features using TypeScript and React."],
    coverLetter: ""
  };
}

function expectedKeywordsPresent(actual: string[], expected: readonly string[]) {
  return expected.every((keyword) => actual.some((actualKeyword) => actualKeyword.toLowerCase() === keyword.toLowerCase()));
}
