import type { AnalyseJobResponse, JobAnalysis, JobIntakeInput } from "@/lib/db/types";
import { createAgentTrace, persistAgentTrace } from "@/lib/ai/agentTrace";
import { analysisRepairAgent } from "@/lib/ai/agents/analysisRepairAgent";
import { applicationTrackerAgent } from "@/lib/ai/agents/applicationTrackerAgent";
import { atsKeywordAgent } from "@/lib/ai/agents/atsKeywordAgent";
import { coverLetterAgent } from "@/lib/ai/agents/coverLetterAgent";
import { jobParserAgent } from "@/lib/ai/agents/jobParserAgent";
import { qualityReviewAgent } from "@/lib/ai/agents/qualityReviewAgent";
import { resumeMatcherAgent } from "@/lib/ai/agents/resumeMatcherAgent";
import { generateAnalysisWithLlm } from "@/lib/ai/llmClient";

export async function runJobAnalysisWorkflow(input: JobIntakeInput): Promise<AnalyseJobResponse> {
  const parsedJob = jobParserAgent(input);
  const traces = [
    createAgentTrace("Job Parser Agent", "Normalize company, title, and seniority signal from job intake.", {
      normalizedCompanyName: parsedJob.normalizedCompanyName,
      normalizedJobTitle: parsedJob.normalizedJobTitle,
      descriptionWordCount: parsedJob.descriptionWordCount,
      detectedSeniority: parsedJob.detectedSeniority
    })
  ];

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

  const coverLetter = coverLetterAgent(baseAnalysis);
  traces.push(
    createAgentTrace("Cover Letter Agent", "Normalize final tailored cover letter output.", {
      wordCount: coverLetter.split(/\s+/).filter(Boolean).length
    })
  );

  let analysis: JobAnalysis = {
    ...baseAnalysis,
    ...ats,
    ...matcher,
    coverLetter
  };

  let qualityReview = qualityReviewAgent(normalizedInput, analysis);
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
          repairedMatchScore: analysis.matchScore,
          coverLetterWordCount: analysis.coverLetter.split(/\s+/).filter(Boolean).length
        })
      );

      qualityReview = qualityReviewAgent(normalizedInput, analysis);
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

  const persistence = await applicationTrackerAgent(normalizedInput, analysis);
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
