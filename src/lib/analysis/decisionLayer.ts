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
  domainConfidence: number;
  criticalRequirementMissing: boolean;
  criticalMissingItems: string[];
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
  criticalTools?: string[];
  qualificationSignals?: string[];
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
    criticalTools: ["react", "next.js", "typescript", "node.js", "python", "java", "aws", "docker", "kubernetes"],
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
    criticalTools: ["revit", "autocad", "cad", "bca", "ncc"],
    qualificationSignals: ["registered architect", "architecture degree", "architectural registration"],
    alternativeRoles: ["Graduate Architect", "Architectural Technician", "Revit Documenter", "Project Architect"]
  },
  {
    label: "Data / Analytics",
    keywords: [
      "data analyst",
      "analytics",
      "bi analyst",
      "business intelligence",
      "power bi",
      "tableau",
      "excel",
      "sql",
      "python",
      "pandas",
      "data visualization",
      "reporting",
      "dashboard",
      "statistics",
      "machine learning"
    ],
    criticalTools: ["sql", "excel", "power bi", "tableau", "python"],
    alternativeRoles: ["Data Analyst", "BI Analyst", "Junior Data Scientist", "Reporting Analyst"]
  },
  {
    label: "Cybersecurity",
    keywords: [
      "cybersecurity",
      "security analyst",
      "soc",
      "siem",
      "incident response",
      "threat",
      "vulnerability",
      "penetration testing",
      "iam",
      "iso 27001",
      "nist",
      "security clearance"
    ],
    criticalTools: ["siem", "splunk", "sentinel", "incident response", "vulnerability", "security clearance"],
    qualificationSignals: ["security clearance", "cissp", "comptia security", "security+"],
    alternativeRoles: ["Cybersecurity Analyst", "SOC Analyst", "Security Operations Analyst", "GRC Analyst"]
  },
  {
    label: "Cloud / DevOps",
    keywords: [
      "devops",
      "cloud engineer",
      "aws",
      "azure",
      "gcp",
      "kubernetes",
      "docker",
      "terraform",
      "ci/cd",
      "infrastructure",
      "sre",
      "linux",
      "monitoring"
    ],
    criticalTools: ["aws", "azure", "gcp", "kubernetes", "docker", "terraform", "linux"],
    alternativeRoles: ["Cloud Engineer", "DevOps Engineer", "Platform Engineer", "Site Reliability Engineer"]
  },
  {
    label: "Product Management",
    keywords: [
      "product manager",
      "product owner",
      "roadmap",
      "backlog",
      "user stories",
      "go-to-market",
      "stakeholder",
      "product strategy",
      "feature prioritization",
      "customer discovery"
    ],
    alternativeRoles: ["Associate Product Manager", "Product Owner", "Technical Product Coordinator", "Business Analyst"]
  },
  {
    label: "UX / UI Design",
    keywords: [
      "ux designer",
      "ui designer",
      "product designer",
      "figma",
      "wireframe",
      "prototype",
      "user research",
      "design system",
      "usability testing",
      "interaction design",
      "visual design"
    ],
    criticalTools: ["figma", "user research", "wireframe", "prototype"],
    alternativeRoles: ["UX Designer", "UI Designer", "Product Designer", "UX Research Assistant"]
  },
  {
    label: "Civil / Mechanical / Electrical Engineering",
    keywords: [
      "civil engineer",
      "mechanical engineer",
      "electrical engineer",
      "structural",
      "infrastructure",
      "site engineer",
      "hvac",
      "mechanical design",
      "electrical systems",
      "engineering drawings",
      "australian standards",
      "project engineer"
    ],
    criticalTools: ["autocad", "solidworks", "matlab", "hvac", "australian standards"],
    qualificationSignals: ["engineering degree", "chartered engineer", "engineers australia"],
    alternativeRoles: ["Graduate Engineer", "Project Engineer", "Engineering Coordinator", "Technical Officer"]
  },
  {
    label: "Hospitality / Retail",
    keywords: [
      "retail",
      "hospitality",
      "customer service",
      "pos",
      "barista",
      "restaurant",
      "store",
      "sales assistant",
      "front office",
      "chef",
      "kitchen",
      "food safety",
      "shift supervisor"
    ],
    qualificationSignals: ["rsa", "food safety certificate", "commercial cookery"],
    alternativeRoles: ["Customer Service Representative", "Retail Supervisor", "Front Office Assistant", "Restaurant Team Leader"]
  },
  {
    label: "Healthcare / Nursing",
    keywords: [
      "registered nurse",
      "nursing",
      "healthcare",
      "clinical",
      "patient",
      "aged care",
      "hospital",
      "medical",
      "allied health",
      "pharmacy",
      "ahpra",
      "medication",
      "wound care"
    ],
    qualificationSignals: ["ahpra registration", "registered nurse", "nursing degree", "clinical registration"],
    alternativeRoles: ["Registered Nurse", "Clinical Support Officer", "Healthcare Assistant", "HealthTech Support Specialist"]
  },
  {
    label: "Finance / Accounting",
    keywords: [
      "accountant",
      "accounting",
      "finance",
      "financial analyst",
      "bookkeeping",
      "payroll",
      "tax",
      "audit",
      "accounts payable",
      "accounts receivable",
      "xero",
      "myob",
      "cpa",
      "ca qualified"
    ],
    criticalTools: ["xero", "myob", "excel"],
    qualificationSignals: ["cpa", "ca qualified", "accounting degree"],
    alternativeRoles: ["Accountant", "Assistant Accountant", "Finance Officer", "Accounts Payable Officer"]
  },
  {
    label: "Sales / Marketing",
    keywords: [
      "marketing",
      "digital marketing",
      "seo",
      "sem",
      "campaign",
      "content marketing",
      "social media",
      "sales",
      "account executive",
      "crm",
      "hubspot",
      "google analytics"
    ],
    criticalTools: ["google analytics", "hubspot", "crm", "seo", "sem"],
    alternativeRoles: ["Marketing Coordinator", "Digital Marketing Assistant", "Sales Development Representative", "Account Coordinator"]
  },
  {
    label: "Education / Training",
    keywords: [
      "teacher",
      "education",
      "training",
      "trainer",
      "curriculum",
      "lesson planning",
      "classroom",
      "student",
      "learning design",
      "tae401",
      "working with children"
    ],
    qualificationSignals: ["teaching registration", "working with children", "tae401", "education degree"],
    alternativeRoles: ["Trainer", "Learning Support Officer", "Instructional Designer", "Education Coordinator"]
  },
  {
    label: "Legal / Compliance",
    keywords: [
      "legal",
      "lawyer",
      "solicitor",
      "paralegal",
      "compliance",
      "risk",
      "regulatory",
      "contract review",
      "privacy",
      "aml",
      "kyc",
      "policy"
    ],
    qualificationSignals: ["law degree", "admitted solicitor", "legal practising certificate"],
    alternativeRoles: ["Compliance Analyst", "Paralegal", "Risk Analyst", "Policy Officer"]
  },
  {
    label: "Human Resources / Recruitment",
    keywords: [
      "human resources",
      "hr",
      "recruitment",
      "talent acquisition",
      "onboarding",
      "employee relations",
      "performance management",
      "workforce planning",
      "people operations"
    ],
    alternativeRoles: ["HR Coordinator", "Recruitment Coordinator", "Talent Acquisition Assistant", "People Operations Coordinator"]
  },
  {
    label: "Customer Support / Operations",
    keywords: [
      "customer support",
      "customer success",
      "operations",
      "admin",
      "administration",
      "support officer",
      "service desk",
      "call centre",
      "process improvement",
      "scheduling",
      "dispatch"
    ],
    alternativeRoles: ["Customer Support Specialist", "Operations Coordinator", "Service Desk Analyst", "Administrative Officer"]
  }
];

const unknownDomainLabel = "Other / Unknown";

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
  const criticalRequirementResult = detectCriticalRequirementGaps(input, analysis, jobDomain.profile);
  const domainMismatch = isDomainMismatch(resumeDomain, jobDomain, analysis.matchScore, criticalRequirementResult.items.length > 0);
  const criticalRequirementMissing = criticalRequirementResult.items.length > 0;
  const decision = chooseDecision(analysis.matchScore, domainMismatch, criticalRequirementMissing);
  const ats = buildAtsKeywordIntelligence(input, analysis);
  const confidence = chooseConfidence({
    decision,
    matchScore: analysis.matchScore,
    domainMismatch,
    criticalRequirementMissing,
    domainConfidence: Math.min(resumeDomain.confidence, jobDomain.confidence)
  });

  return {
    recommendation: {
      decision,
      confidence,
      reason: buildDecisionReason({
        decision,
        domainMismatch,
        criticalRequirementMissing,
        criticalMissingItems: criticalRequirementResult.items,
        resumeDomain: resumeDomain.label,
        jobDomain: jobDomain.label,
        matchScore: analysis.matchScore
      }),
      domainMismatch,
      resumeDomain: resumeDomain.label,
      jobDomain: jobDomain.label,
      domainConfidence: Math.min(resumeDomain.confidence, jobDomain.confidence),
      criticalRequirementMissing,
      criticalMissingItems: criticalRequirementResult.items,
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
  const second = scored[1];
  const confidence = best ? calculateDomainConfidence(best.score, second?.score || 0) : 0;

  if (!best || best.score < 2 || confidence < 0.3) {
    return { label: unknownDomainLabel, score: best?.score || 0, confidence, profile: null };
  }

  return { label: best.label, score: best.score, confidence, profile: best.profile };
}

function isDomainMismatch(
  resumeDomain: { label: string; score: number; confidence: number },
  jobDomain: { label: string; score: number; confidence: number },
  matchScore: number,
  hasCriticalRequirementGaps: boolean
) {
  if (resumeDomain.label === unknownDomainLabel || jobDomain.label === unknownDomainLabel) return false;
  if (resumeDomain.label === jobDomain.label) return false;
  const clearDifferentDomains = resumeDomain.confidence >= 0.45 && jobDomain.confidence >= 0.45;
  return clearDifferentDomains && matchScore < 45 && (hasCriticalRequirementGaps || resumeDomain.score >= 3 || jobDomain.score >= 3);
}

function chooseDecision(
  matchScore: number,
  domainMismatch: boolean,
  criticalRequirementMissing: boolean
): ApplicationDecision {
  if (matchScore < 30 && domainMismatch) return "Not Recommended";
  if (matchScore < 30 && criticalRequirementMissing) return "Not Recommended";
  if (matchScore >= 30 && matchScore <= 60) return "Risky";
  if (matchScore > 60 && !domainMismatch) return "Recommended";
  return "Risky";
}

function buildDecisionReason({
  decision,
  domainMismatch,
  criticalRequirementMissing,
  criticalMissingItems,
  resumeDomain,
  jobDomain,
  matchScore
}: {
  decision: ApplicationDecision;
  domainMismatch: boolean;
  criticalRequirementMissing: boolean;
  criticalMissingItems: string[];
  resumeDomain: string;
  jobDomain: string;
  matchScore: number;
}) {
  if (decision === "Not Recommended" && domainMismatch) {
    return `This role appears to be in ${jobDomain}, while the resume is aligned with ${resumeDomain}.`;
  }

  if (decision === "Not Recommended" && criticalRequirementMissing) {
    return `This role has critical requirements not clearly shown in the resume: ${criticalMissingItems.slice(0, 3).join(", ")}.`;
  }

  if (decision === "Risky") {
    if (criticalRequirementMissing) {
      return `The match is weak and the resume does not clearly show critical requirements: ${criticalMissingItems.slice(0, 2).join(", ")}.`;
    }
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
  const resumeDomain = detectDomain(normalizedResume);
  const profile = resumeDomain.profile || domainProfiles[0];

  return profile.keywords
    .filter((keyword) => termAppears(normalizedResume, keyword))
    .filter((keyword) => !termAppears(jobText, keyword))
    .map(toDisplayKeyword)
    .filter(unique);
}

function detectCriticalRequirementGaps(
  input: JobIntakeInput,
  analysis: JobAnalysis,
  jobProfile: DomainProfile | null
) {
  const resumeText = normalize(input.resumeText);
  const jobText = normalize(`${input.jobTitle} ${input.jobDescription} ${analysis.requiredSkills.join(" ")} ${analysis.missingKeywords.join(" ")}`);
  const items: string[] = [];

  for (const signal of criticalRequirementSignals) {
    if (signal.patterns.some((pattern) => pattern.test(jobText)) && !signal.resumePatterns.some((pattern) => pattern.test(resumeText))) {
      items.push(signal.label);
    }
  }

  const yearsRequirement = extractRequiredYears(jobText);
  const resumeYears = extractResumeYears(resumeText);
  if (yearsRequirement >= 5 && resumeYears > 0 && resumeYears + 2 < yearsRequirement) {
    items.push(`${yearsRequirement}+ years of experience`);
  }

  const profileTools = jobProfile?.criticalTools || [];
  for (const tool of profileTools) {
    if (termAppears(jobText, tool) && !termAppears(resumeText, tool)) {
      items.push(toDisplayKeyword(tool));
    }
  }

  for (const qualification of jobProfile?.qualificationSignals || []) {
    if (termAppears(jobText, qualification) && !termAppears(resumeText, qualification)) {
      items.push(toDisplayKeyword(qualification));
    }
  }

  for (const missing of analysis.missingKeywords) {
    if (looksCriticalMissingKeyword(missing)) {
      items.push(missing);
    }
  }

  return { items: items.filter(unique).slice(0, 8) };
}

function calculateDomainConfidence(bestScore: number, secondScore: number) {
  if (bestScore <= 0) return 0;
  const separation = Math.max(0, bestScore - secondScore) / Math.max(bestScore, 1);
  const evidence = Math.min(1, bestScore / 8);
  return Number(Math.max(0, Math.min(1, evidence * 0.65 + separation * 0.35)).toFixed(2));
}

function chooseConfidence({
  decision,
  matchScore,
  domainMismatch,
  criticalRequirementMissing,
  domainConfidence
}: {
  decision: ApplicationDecision;
  matchScore: number;
  domainMismatch: boolean;
  criticalRequirementMissing: boolean;
  domainConfidence: number;
}): DecisionConfidence {
  if (decision === "Not Recommended" && (domainMismatch || criticalRequirementMissing)) return "High";
  if (decision === "Recommended" && matchScore >= 75 && domainConfidence >= 0.45) return "High";
  if (decision === "Risky" && matchScore < 40) return "Medium";
  return "Medium";
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
    "ci/cd": "CI/CD",
    ahpra: "AHPRA registration",
    "registered nurse": "Registered Nurse",
    "registered architect": "registered architect",
    "building codes": "building codes",
    "security clearance": "security clearance",
    cpa: "CPA",
    "ca qualified": "CA qualification",
    figma: "Figma",
    revit: "Revit",
    autocad: "AutoCAD",
    "power bi": "Power BI"
  };

  return displayMap[keyword.toLowerCase()] || keyword;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^\w\s.+/#-]/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractRequiredYears(jobText: string) {
  const matches = [...jobText.matchAll(/(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:relevant\s+)?experience/g)];
  return matches.reduce((max, match) => Math.max(max, Number(match[1] || 0)), 0);
}

function extractResumeYears(resumeText: string) {
  const explicit = [...resumeText.matchAll(/(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+|relevant\s+)?experience/g)];
  const explicitYears = explicit.reduce((max, match) => Math.max(max, Number(match[1] || 0)), 0);
  if (explicitYears) return explicitYears;

  const years = [...resumeText.matchAll(/\b(20\d{2})\b/g)].map((match) => Number(match[1]));
  if (years.length < 2) return 0;
  return Math.max(...years) - Math.min(...years);
}

function looksCriticalMissingKeyword(value: string) {
  const normalized = normalize(value);
  return criticalKeywordPatterns.some((pattern) => pattern.test(normalized));
}

const criticalKeywordPatterns = [
  /registration/,
  /registered/,
  /licen[cs]e/,
  /certification/,
  /degree/,
  /clearance/,
  /ahpra/,
  /cpa/,
  /chartered/,
  /security\+/,
  /revit/,
  /autocad/,
  /figma/,
  /power bi/,
  /tableau/
];

const criticalRequirementSignals = [
  {
    label: "professional registration or licence",
    patterns: [
      /must (?:be )?(?:registered|licensed|licenced)/,
      /current (?:registration|licen[cs]e)/,
      /professional registration/,
      /registered (?:nurse|architect|teacher|engineer)/
    ],
    resumePatterns: [/registered/, /licen[cs]ed/, /licen[cs]e/, /registration/]
  },
  {
    label: "required degree or formal qualification",
    patterns: [
      /(?:bachelor|master|degree) (?:in|of)/,
      /tertiary qualification/,
      /formal qualification/,
      /diploma in/,
      /certificate (?:iii|iv|3|4)/
    ],
    resumePatterns: [/bachelor/, /master/, /degree/, /diploma/, /certificate/, /certification/]
  },
  {
    label: "security clearance",
    patterns: [/security clearance/, /baseline clearance/, /nv1/, /nv2/, /citizenship required/],
    resumePatterns: [/security clearance/, /baseline clearance/, /nv1/, /nv2/, /citizen/]
  },
  {
    label: "mandatory industry experience",
    patterns: [/must have .*industry experience/, /mandatory .*industry experience/, /required .*domain experience/],
    resumePatterns: [/industry experience/, /domain experience/]
  },
  {
    label: "legal right to work",
    patterns: [/full working rights/, /right to work/, /work rights/, /visa/],
    resumePatterns: [/working rights/, /right to work/, /visa/, /citizen/, /permanent resident/]
  }
];

const defaultAlternativeRoles = [
  "Full Stack Developer",
  "Software Engineer",
  "Backend Developer",
  "Frontend Developer",
  "Technical Project Coordinator"
];
