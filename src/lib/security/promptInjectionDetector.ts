import type { PromptInjectionFinding, RiskLevel } from "@/lib/security/types";

const HIGH_RISK_PATTERNS = [
  /ignore (all )?(previous|prior|above) instructions?/i,
  /disregard (all )?(previous|prior|above) instructions?/i,
  /you are now/i,
  /reveal (your|the) (system )?prompt/i,
  /show (your|the) (system )?prompt/i,
  /jailbreak/i,
  /do anything now/i,
  /bypass (the )?(rules|guardrails|safety|instructions)/i,
  /ignore (the )?(resume|job description|job ad|grounding)/i,
  /do not (use|consider|follow) (the )?(resume|job description|job ad)/i
];

const MEDIUM_RISK_PATTERNS = [
  /override (the )?(score|scoring|instructions|system)/i,
  /developer message/i,
  /system prompt/i,
  /set (the )?(match )?score to \d{2,3}/i,
  /always (return|output|say)/i,
  /output exactly/i,
  /force (the )?(result|score|output)/i,
  /do not mention (gaps|weaknesses|missing keywords)/i,
  /pretend (that|to be)/i
];

const CONTEXT_PATTERNS = [
  /\b(prompt engineer|prompt engineering|llm|large language model|ai security|security testing|red team)\b/i,
  /\bresponsibilities|requirements|qualifications|skills|experience\b/i
];

export function detectPromptInjection(
  field: PromptInjectionFinding["field"],
  value: string
): PromptInjectionFinding {
  const issues: string[] = [];
  let riskScore = 0;

  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(value)) {
      riskScore += 4;
      issues.push("Contains instruction override language.");
    }
  }

  for (const pattern of MEDIUM_RISK_PATTERNS) {
    if (pattern.test(value)) {
      riskScore += 2;
      issues.push("Contains language attempting to control the AI output.");
    }
  }

  if (CONTEXT_PATTERNS.some((pattern) => pattern.test(value)) && riskScore <= 3) {
    riskScore = Math.max(0, riskScore - 1);
  }

  return {
    field,
    riskScore,
    riskLevel: toRiskLevel(riskScore),
    issues: Array.from(new Set(issues))
  };
}

export function combineRiskLevels(levels: RiskLevel[]): RiskLevel {
  if (levels.includes("high")) return "high";
  if (levels.includes("medium")) return "medium";
  return "low";
}

function toRiskLevel(score: number): RiskLevel {
  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
}
