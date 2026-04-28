import type { AnalyseJobResponse, JobAnalysis, JobIntakeInput } from "@/lib/db/types";
import { createAgentTrace, persistAgentTrace } from "@/lib/ai/agentTrace";
import { analysisRepairAgent } from "@/lib/ai/agents/analysisRepairAgent";
import { applicationTrackerAgent } from "@/lib/ai/agents/applicationTrackerAgent";
import { atsKeywordAgent } from "@/lib/ai/agents/atsKeywordAgent";
import { jobParserAgent } from "@/lib/ai/agents/jobParserAgent";
import { qualityReviewAgent } from "@/lib/ai/agents/qualityReviewAgent";
import { resumeMatcherAgent } from "@/lib/ai/agents/resumeMatcherAgent";
import { generateAnalysisWithLlm } from "@/lib/ai/llmClient";
import type { InputValidationResult } from "@/lib/security/types";

export async function runJobAnalysisWorkflow(
  input: JobIntakeInput,
  validationResult: InputValidationResult | undefined,
  userId: string
): Promise<AnalyseJobResponse> {
  const parsedJob = jobParserAgent(input);
  const traces = validationResult
    ? [
        createAgentTrace("Input Validation", "Validate, sanitise, and risk-score user input before analysis agents run.", {
          inputValidation: validationResult.isValid ? "Passed" : "Failed",
          sanitisation: "Passed",
          promptInjectionRisk: titleCase(validationResult.riskLevel),
          resumeClassification: validationResult.resumeClassification,
          jobDescriptionClassification: validationResult.jobDescriptionClassification,
          warningCount: validationResult.warnings.length,
          detectedIssues: validationResult.detectedIssues
        })
      ]
    : [];

  traces.push(
    createAgentTrace("Job Parser Agent", "Normalize company, title, and seniority signal from job intake.", {
      normalizedCompanyName: parsedJob.normalizedCompanyName,
      normalizedJobTitle: parsedJob.normalizedJobTitle,
      descriptionWordCount: parsedJob.descriptionWordCount,
      detectedSeniority: parsedJob.detectedSeniority
    })
  );

  const normalizedInput = {
    ...input,
    companyName: parsedJob.normalizedCompanyName,
    jobTitle: parsedJob.normalizedJobTitle
  };

  const { analysis: baseAnalysis, mode, provider } = await generateAnalysisWithLlm(normalizedInput);
  traces.push(
    createAgentTrace("LLM Analysis Provider", "Generate base structured job/resume analysis.", {
      mode,
      provider,
      matchScore: baseAnalysis.matchScore,
      requiredSkillsCount: baseAnalysis.requiredSkills.length,
      missingKeywordsCount: baseAnalysis.missingKeywords.length
    })
  );

  // Agent workflow decision point: each step owns one concern so LangGraph nodes
  // can replace these direct function calls later without changing UI contracts.
  const ats = atsKeywordAgent(normalizedInput, baseAnalysis);
  traces.push(
    createAgentTrace("ATS Keyword Agent", "Extract required skills and missing ATS keywords.", {
      requiredSkills: ats.requiredSkills,
      missingKeywords: ats.missingKeywords
    })
  );

  const matcher = resumeMatcherAgent(normalizedInput, baseAnalysis);
  traces.push(
    createAgentTrace("Resume Matcher Agent", "Score resume fit and identify strengths, gaps, and bullet improvements.", {
      matchScore: matcher.matchScore,
      strengthsCount: matcher.strengths.length,
      gapsCount: matcher.gaps.length,
      suggestedBulletsCount: matcher.suggestedBullets.length
    })
  );

  let analysis: JobAnalysis = {
    ...baseAnalysis,
    ...ats,
    ...matcher,
    coverLetter: ""
  };

  let qualityReview = qualityReviewAgent(normalizedInput, analysis, { includeCoverLetter: false });
  traces.push(
    createAgentTrace("Quality Review Agent", "Review final analysis for consistency, grounding, and cover-letter quality.", {
      qualityScore: qualityReview.qualityScore,
      passed: qualityReview.passed,
      warnings: qualityReview.warnings,
      recommendations: qualityReview.recommendations,
      categoryScores: qualityReview.categoryScores,
      checks: qualityReview.checks
    })
  );

  if (!qualityReview.passed && mode === "llm" && provider !== "mock") {
    try {
      const repair = await analysisRepairAgent({
        input: normalizedInput,
        analysis,
        review: qualityReview,
        provider
      });

      analysis = repair.analysis;
      traces.push(
        createAgentTrace("Analysis Repair Agent", "Repair failed quality-review sections with the same LLM provider.", {
          repairedBy: repair.repairedBy,
          attemptedWarnings: repair.attemptedWarnings,
          attemptedRecommendations: repair.attemptedRecommendations,
          repairedMatchScore: analysis.matchScore
        })
      );

      qualityReview = qualityReviewAgent(normalizedInput, analysis, { includeCoverLetter: false });
      traces.push(
        createAgentTrace("Quality Review Agent (Repair Pass)", "Re-review repaired analysis before persistence.", {
          qualityScore: qualityReview.qualityScore,
          passed: qualityReview.passed,
          warnings: qualityReview.warnings,
          recommendations: qualityReview.recommendations,
          categoryScores: qualityReview.categoryScores,
          checks: qualityReview.checks
        })
      );
    } catch (error) {
      traces.push(
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

  const persistence = await applicationTrackerAgent(normalizedInput, analysis, userId);
  traces.push(
    createAgentTrace("Application Tracker Agent", "Persist application and analysis result to Supabase.", {
      persistence: persistence.persistence,
      applicationId: persistence.application?.id || null
    })
  );

  if (persistence.application) {
    await persistAgentTrace(persistence.application.id, traces);
  }

  return {
    analysis,
    mode,
    llmProvider: provider,
    ...persistence
  };
}

function titleCase(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
