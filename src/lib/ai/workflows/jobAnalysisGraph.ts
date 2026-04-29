import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
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

const JobAnalysisStateAnnotation = Annotation.Root({
  input: Annotation<JobIntakeInput>(),
  userId: Annotation<string>(),
  validationResult: Annotation<InputValidationResult | undefined>(),
  parsedJob: Annotation<JobAnalysisWorkflowState["parsedJob"]>(),
  normalizedInput: Annotation<JobIntakeInput | undefined>(),
  baseAnalysis: Annotation<JobAnalysis | undefined>(),
  ats: Annotation<JobAnalysisWorkflowState["ats"]>(),
  matcher: Annotation<JobAnalysisWorkflowState["matcher"]>(),
  analysis: Annotation<JobAnalysis | undefined>(),
  qualityReview: Annotation<JobAnalysisWorkflowState["qualityReview"]>(),
  repair: Annotation<JobAnalysisWorkflowState["repair"]>(),
  mode: Annotation<JobAnalysisWorkflowState["mode"]>(),
  provider: Annotation<JobAnalysisWorkflowState["provider"]>(),
  persistence: Annotation<JobAnalysisWorkflowState["persistence"]>(),
  traces: Annotation<JobAnalysisWorkflowState["traces"]>()
});

type WorkflowArgs = {
  input: JobIntakeInput;
  validationResult?: InputValidationResult;
  userId: string;
};

const compiledJobAnalysisGraph = new StateGraph(JobAnalysisStateAnnotation)
  .addNode("inputValidationNode", inputValidationNode)
  .addNode("jobParserNode", jobParserNode)
  .addNode("llmAnalysisNode", llmAnalysisNode)
  .addNode("atsKeywordNode", atsKeywordNode)
  .addNode("resumeMatcherNode", resumeMatcherNode)
  .addNode("composeAnalysisNode", composeAnalysisNode)
  .addNode("qualityReviewNode", qualityReviewNode)
  .addNode("analysisRepairNode", analysisRepairNode)
  .addNode("qualityReviewRepairPassNode", qualityReviewRepairPassNode)
  .addNode("applicationTrackerNode", applicationTrackerNode)
  .addNode("persistTraceNode", persistTraceNode)
  .addEdge(START, "inputValidationNode")
  .addEdge("inputValidationNode", "jobParserNode")
  .addEdge("jobParserNode", "llmAnalysisNode")
  .addEdge("llmAnalysisNode", "atsKeywordNode")
  .addEdge("atsKeywordNode", "resumeMatcherNode")
  .addEdge("resumeMatcherNode", "composeAnalysisNode")
  .addEdge("composeAnalysisNode", "qualityReviewNode")
  .addConditionalEdges("qualityReviewNode", routeAfterQualityReview, {
    repair: "analysisRepairNode",
    persist: "applicationTrackerNode"
  })
  .addEdge("analysisRepairNode", "qualityReviewRepairPassNode")
  .addEdge("qualityReviewRepairPassNode", "applicationTrackerNode")
  .addEdge("applicationTrackerNode", "persistTraceNode")
  .addEdge("persistTraceNode", END)
  .compile();

export async function runJobAnalysisGraph({ input, validationResult, userId }: WorkflowArgs): Promise<AnalyseJobResponse> {
  const state = await compiledJobAnalysisGraph.invoke({
    input,
    validationResult,
    userId,
    traces: []
  });

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

function qualityReviewNode(state: JobAnalysisWorkflowState): JobAnalysisWorkflowState {
  return reviewAnalysis(state);
}

function reviewAnalysis(
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

function qualityReviewRepairPassNode(state: JobAnalysisWorkflowState): JobAnalysisWorkflowState {
  if (!state.repair) return state;
  return reviewAnalysis(state, { repairPass: true });
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

async function persistTraceNode(state: JobAnalysisWorkflowState): Promise<JobAnalysisWorkflowState> {
  if (state.persistence?.application) {
    await persistAgentTrace(state.persistence.application.id, state.traces);
  }

  return state;
}

function routeAfterQualityReview(state: JobAnalysisWorkflowState) {
  return !state.qualityReview?.passed && state.mode === "llm" && state.provider !== "mock" ? "repair" : "persist";
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
