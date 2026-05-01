import { evaluateAnalysisDecision } from "@/lib/analysis/decisionLayer";
import type { JobAnalysis, JobIntakeInput } from "@/lib/db/types";

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

const tests = [
  {
    name: "software resume vs architecture job is not recommended",
    input: createInput("Senior Architect", architectureJob),
    analysis: createAnalysis(15, ["Revit", "AutoCAD", "registered architect", "building codes"]),
    expectedDecision: "Not Recommended",
    expectedMismatch: true
  },
  {
    name: "software resume vs software job is recommended",
    input: createInput("Full Stack AI Engineer", softwareJob),
    analysis: createAnalysis(82, ["accessibility"]),
    expectedDecision: "Recommended",
    expectedMismatch: false
  },
  {
    name: "moderate score is risky",
    input: createInput("Frontend Developer", softwareJob),
    analysis: createAnalysis(48, ["testing"]),
    expectedDecision: "Risky",
    expectedMismatch: false
  }
] as const;

let passed = 0;

for (const test of tests) {
  const result = evaluateAnalysisDecision(test.input, test.analysis);
  const ok =
    result.recommendation.decision === test.expectedDecision &&
    result.recommendation.domainMismatch === test.expectedMismatch;

  if (ok) {
    passed += 1;
    console.log(`PASS ${test.name}`);
  } else {
    console.error(
      `FAIL ${test.name}: expected ${test.expectedDecision}/${test.expectedMismatch}, got ${result.recommendation.decision}/${result.recommendation.domainMismatch}`
    );
  }
}

if (passed !== tests.length) {
  process.exitCode = 1;
}

console.log(`Decision tests: ${passed}/${tests.length} passed`);

function createInput(jobTitle: string, jobDescription: string): JobIntakeInput {
  return {
    companyName: "Example Company",
    jobTitle,
    jobDescription,
    resumeText: softwareResume
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
