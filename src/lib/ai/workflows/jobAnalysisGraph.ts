import { createAgentTrace, persistAgentTrace } from "@/lib/ai/agentTrace";
import { analysisRepairAgent } from "@/lib/ai/agents/analysisRepairAgent";
import { applicationTrackerAgent } from "@/lib/ai/agents/applicationTrackerAgent";
import { atsKeywordAgent } from "@/lib/ai/agents/atsKeywordAgent";
import { jobParserAgent } from "@/lib/ai/agents/jobParserAgent";
import { qualityReviewAgent } from "@/lib/ai/agents/qualityReviewAgent";
import { resumeMatcherAgent } from "@/lib/ai/agents/resumeMatcherAgent";
import { generateAnalysisWithLlm } from "@/lib/ai/llmClient";
import type { AnalyseJobResponse, JobAnalysis, JobIntakeInput } from "@/lib/db/types";
import type { InputValidationResult } from "@/lib/security/types";
import type { AnalysisMode, JobAnalysisWorkflowState } from "@/lib/ai/workflows/jobAnalysisState";

type WorkflowArgs = {
  input: JobIntakeInput;
  validationResult?: InputValidationResult;
  userId: string;
};

export async function runJobAnalysisGraph({ input, validationResult, userId }: WorkflowArgs): Promise<AnalyseJobResponse> {
  let state: JobAnalysisWorkflowState = {
    input,
    validationResult,
    userId,
    traces: []
  };

  state = inputValidationNode(state);
  state = jobParserNode(state);
  state = await llmAnalysisNode(state);
  state = atsKeywordNode(state);
  state = resumeMatcherNode(state);
  state = composeAnalysisNode(state);
  state = qualityReviewNode(state);

  if (shouldRepairAnalysis(state)) {
    state = await analysisRepairNode(state);

    if (state.repair) {
      state = qualityReviewNode(state, { repairPass: true });
    }
  }

  state = await applicationTrackerNode(state);
  await persistTraceNode(state);

  return toAnalyseJobResponse(state);
}

function inputValidationNode(state: JobAnalysisWorkflowState): JobAnalysisWorkflowState {
  if (!state.validationResult) return state;

  return addTrace(
    state,
    createAgentTrace("Input Validation", "Validate, sanitise, and risk-score user input before analysis agents run.", {
      inputValidation: state.validationResult.isValid ? "Passed" : "Failed",
      sanitisation: "Passed",
      promptInjectionRisk: titleCase(state.validationResult.riskLevel),
      resumeClassification: state.validationResult.resumeClassification,
      jobDescriptionClassification: state.validationResult.jobDescriptionClassification,
      warningCount: state.validationResult.warnings.length,
      detectedIssues: state.validationResult.detectedIssues
    })
  );
}

function jobParserNode(state: JobAnalysisWorkflowState): JobAnalysisWorkflowState {
  const parsedJob = jobParserAgent(state.input);
  const normalizedInput = {
    ...state.input,
    companyName: parsedJob.normalizedCompanyName,
    jobTitle: parsedJob.normalizedJobTitle
  };

  return addTrace(
    {
      ...state,
      parsedJob,
      normalizedInput
    },
    createAgentTrace("Job Parser Agent", "Normalize company, title, and seniority signal from job intake.", {
      normalizedCompanyName: parsedJob.normalizedCompanyName,
      normalizedJobTitle: parsedJob.normalizedJobTitle,
      descriptionWordCount: parsedJob.descriptionWordCount,
      detectedSeniority: parsedJob.detectedSeniority
    })
  );
}

async function llmAnalysisNode(state: JobAnalysisWorkflowState): Promise<JobAnalysisWorkflowState> {
  const normalizedInput = requireNormalizedInput(state);
  const { analysis: baseAnalysis, mode, provider } = await generateAnalysisWithLlm(normalizedInput);

  return addTrace(
    {
      ...state,
      baseAnalysis,
      mode,
      provider
    },
    createAgentTrace("LLM Analysis Provider", "Generate base structured job/resume analysis.", {
      mode,
      provider,
      matchScore: baseAnalysis.matchScore,
      requiredSkillsCount: baseAnalysis.requiredSkills.length,
      missingKeywordsCount: baseAnalysis.missingKeywords.length
    })
  );
}

function atsKeywordNode(state: JobAnalysisWorkflowState): JobAnalysisWorkflowState {
  const normalizedInput = requireNormalizedInput(state);
  const baseAnalysis = requireBaseAnalysis(state);
  const ats = atsKeywordAgent(normalizedInput, baseAnalysis);

  return addTrace(
    {
      ...state,
      ats
    },
    createAgentTrace("ATS Keyword Agent", "Extract required skills and missing ATS keywords.", {
      requiredSkills: ats.requiredSkills,
      missingKeywords: ats.missingKeywords
    })
  );
}

function resumeMatcherNode(state: JobAnalysisWorkflowState): JobAnalysisWorkflowState {
  const normalizedInput = requireNormalizedInput(state);
  const baseAnalysis = requireBaseAnalysis(state);
  const matcher = resumeMatcherAgent(normalizedInput, baseAnalysis);

  return addTrace(
    {
      ...state,
      matcher
    },
    createAgentTrace("Resume Matcher Agent", "Score resume fit and identify strengths, gaps, and bullet improvements.", {
      matchScore: matcher.matchScore,
      strengthsCount: matcher.strengths.length,
      gapsCount: matcher.gaps.length,
      suggestedBulletsCount: matcher.suggestedBullets.length
    })
  );
}

function composeAnalysisNode(state: JobAnalysisWorkflowState): JobAnalysisWorkflowState {
  const analysis: JobAnalysis = {
    ...requireBaseAnalysis(state),
    ...requireAts(state),
    ...requireMatcher(state),
    coverLetter: ""
  };

  return {
    ...state,
    analysis
  };
}

function qualityReviewNode(
  state: JobAnalysisWorkflowState,
  options: { repairPass?: boolean } = {}
): JobAnalysisWorkflowState {
  const normalizedInput = requireNormalizedInput(state);
  const analysis = requireAnalysis(state);
  const qualityReview = qualityReviewAgent(normalizedInput, analysis, { includeCoverLetter: false });
  const agentName = options.repairPass ? "Quality Review Agent (Repair Pass)" : "Quality Review Agent";
  const inputSummary = options.repairPass
    ? "Re-review repaired analysis before persistence."
    : "Review final analysis for consistency, grounding, and cover-letter quality.";

  return addTrace(
    {
      ...state,
      qualityReview
    },
    createAgentTrace(agentName, inputSummary, {
      qualityScore: qualityReview.qualityScore,
      passed: qualityReview.passed,
      warnings: qualityReview.warnings,
      recommendations: qualityReview.recommendations,
      categoryScores: qualityReview.categoryScores,
      checks: qualityReview.checks
    })
  );
}

async function analysisRepairNode(state: JobAnalysisWorkflowState): Promise<JobAnalysisWorkflowState> {
  const normalizedInput = requireNormalizedInput(state);
  const analysis = requireAnalysis(state);
  const qualityReview = requireQualityReview(state);
  const provider = requireLlmProvider(state);

  try {
    const repair = await analysisRepairAgent({
      input: normalizedInput,
      analysis,
      review: qualityReview,
      provider
    });

    return addTrace(
      {
        ...state,
        repair,
        analysis: repair.analysis
      },
      createAgentTrace("Analysis Repair Agent", "Repair failed quality-review sections with the same LLM provider.", {
        repairedBy: repair.repairedBy,
        attemptedWarnings: repair.attemptedWarnings,
        attemptedRecommendations: repair.attemptedRecommendations,
        repairedMatchScore: repair.analysis.matchScore
      })
    );
  } catch (error) {
    return addTrace(
      state,
      createAgentTrace(
        "Analysis Repair Agent",
        "Repair failed; continue with original reviewed analysis so the application can still be saved.",
        {
          provider,
          error: error instanceof Error ? error.message : "Unknown repair error",
          originalQualityScore: qualityReview.qualityScore
        },
        "failed"
      )
    );
  }
}

async function applicationTrackerNode(state: JobAnalysisWorkflowState): Promise<JobAnalysisWorkflowState> {
  const normalizedInput = requireNormalizedInput(state);
  const analysis = requireAnalysis(state);
  const persistence = await applicationTrackerAgent(normalizedInput, analysis, state.userId);

  return addTrace(
    {
      ...state,
      persistence
    },
    createAgentTrace("Application Tracker Agent", "Persist application and analysis result to Supabase.", {
      persistence: persistence.persistence,
      applicationId: persistence.application?.id || null
    })
  );
}

async function persistTraceNode(state: JobAnalysisWorkflowState) {
  if (state.persistence?.application) {
    await persistAgentTrace(state.persistence.application.id, state.traces);
  }
}

function shouldRepairAnalysis(state: JobAnalysisWorkflowState) {
  return !state.qualityReview?.passed && state.mode === "llm" && state.provider !== "mock";
}

function toAnalyseJobResponse(state: JobAnalysisWorkflowState): AnalyseJobResponse {
  return {
    analysis: requireAnalysis(state),
    mode: requireMode(state),
    llmProvider: state.provider,
    ...(state.persistence ?? { application: null, persistence: "skipped" as const })
  };
}

function addTrace(state: JobAnalysisWorkflowState, trace: JobAnalysisWorkflowState["traces"][number]) {
  return {
    ...state,
    traces: [...state.traces, trace]
  };
}

function requireNormalizedInput(state: JobAnalysisWorkflowState) {
  if (!state.normalizedInput) throw new Error("Job analysis graph missing normalized input.");
  return state.normalizedInput;
}

function requireBaseAnalysis(state: JobAnalysisWorkflowState) {
  if (!state.baseAnalysis) throw new Error("Job analysis graph missing base analysis.");
  return state.baseAnalysis;
}

function requireAts(state: JobAnalysisWorkflowState) {
  if (!state.ats) throw new Error("Job analysis graph missing ATS output.");
  return state.ats;
}

function requireMatcher(state: JobAnalysisWorkflowState) {
  if (!state.matcher) throw new Error("Job analysis graph missing resume matcher output.");
  return state.matcher;
}

function requireAnalysis(state: JobAnalysisWorkflowState) {
  if (!state.analysis) throw new Error("Job analysis graph missing composed analysis.");
  return state.analysis;
}

function requireQualityReview(state: JobAnalysisWorkflowState) {
  if (!state.qualityReview) throw new Error("Job analysis graph missing quality review.");
  return state.qualityReview;
}

function requireMode(state: JobAnalysisWorkflowState): AnalysisMode {
  if (!state.mode) throw new Error("Job analysis graph missing analysis mode.");
  return state.mode;
}

function requireLlmProvider(state: JobAnalysisWorkflowState) {
  if (!state.provider || state.provider === "mock") throw new Error("Job analysis graph missing LLM provider.");
  return state.provider;
}

function titleCase(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
