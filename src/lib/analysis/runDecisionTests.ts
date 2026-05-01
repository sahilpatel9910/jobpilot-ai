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

const tests = [
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
  }
] as const;

let passed = 0;

for (const test of tests) {
  const result = evaluateAnalysisDecision(test.input, test.analysis);
  const ok =
    result.recommendation.decision === test.expectedDecision &&
    result.recommendation.domainMismatch === test.expectedMismatch &&
    result.recommendation.criticalRequirementMissing === test.expectedCriticalMissing;

  if (ok) {
    passed += 1;
    console.log(`PASS ${test.name}`);
  } else {
    console.error(
      `FAIL ${test.name}: expected ${test.expectedDecision}/${test.expectedMismatch}/${test.expectedCriticalMissing}, got ${result.recommendation.decision}/${result.recommendation.domainMismatch}/${result.recommendation.criticalRequirementMissing}`
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
