import { parseGitDiff } from '@reviewflow/github-client';
import { ReviewSummary, ReviewSummarySchema, ReviewPolicy, FindingSeverity } from '@reviewflow/shared';
import { runDeterministicAnalysis } from '../deterministic/static-analyzer';
import { SYSTEM_REVIEW_PROMPT, buildUserPrompt } from '../prompts/review-prompt';
import { ILlmProvider, MockLlmProvider } from '../providers/provider-adapter';
import { validateAndGroundFindings, deduplicateAndRankFindings } from './evidence-validator';

export interface RunReviewPipelineParams {
  repoName: string;
  prNumber: number;
  prTitle: string;
  diffText: string;
  policy: ReviewPolicy;
  llmProvider?: ILlmProvider;
}

export interface ReviewPipelineResult {
  summary: ReviewSummary;
  tokensUsed: number;
  estimatedCostUsd: number;
  durationSeconds: number;
}

const SEVERITY_ORDER: FindingSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export async function runReviewPipeline(
  params: RunReviewPipelineParams
): Promise<ReviewPipelineResult> {
  const startTime = Date.now();
  const provider = params.llmProvider || new MockLlmProvider();

  // 1. Parse unified diff
  const parsedFiles = parseGitDiff(params.diffText);

  // 2. Run deterministic static analysis
  const deterministicFindings = runDeterministicAnalysis(parsedFiles);

  // 3. Build prompts for LLM
  const userPrompt = buildUserPrompt({
    repoName: params.repoName,
    prNumber: params.prNumber,
    prTitle: params.prTitle,
    diffText: params.diffText,
    customInstructions: params.policy.customInstructions,
  });

  // 4. Invoke LLM provider
  const llmResult = await provider.generateReview(SYSTEM_REVIEW_PROMPT, userPrompt);

  // 5. Validate LLM response against strict Zod schema
  let parsedLlmSummary: ReviewSummary;
  try {
    let cleanJsonStr = llmResult.rawResponse.trim();
    // Strip markdown code fences if provider returned them
    if (cleanJsonStr.startsWith('```')) {
      cleanJsonStr = cleanJsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    const rawJson = JSON.parse(cleanJsonStr);
    const parseResult = ReviewSummarySchema.safeParse(rawJson);

    if (parseResult.success) {
      parsedLlmSummary = parseResult.data;
    } else {
      console.warn('⚠️ LLM output schema validation failed:', parseResult.error.flatten());
      parsedLlmSummary = {
        summary: 'Automated code review completed with partial findings.',
        overallRisk: deterministicFindings.length > 0 ? 'HIGH' : 'LOW',
        riskRationale: 'Determined based on static checks.',
        keyStrengths: [],
        blockers: [],
        testCoverageAssessment: 'Unverified',
        estimatedReviewTimeSavedMinutes: 15,
        findings: [],
      };
    }
  } catch (err) {
    console.error('❌ Failed to parse LLM JSON response:', err);
    parsedLlmSummary = {
      summary: 'Code review completed with deterministic static analysis only.',
      overallRisk: deterministicFindings.length > 0 ? 'HIGH' : 'SAFE',
      riskRationale: 'LLM response was unparseable; fell back to deterministic static rules.',
      keyStrengths: [],
      blockers: [],
      testCoverageAssessment: 'Unable to evaluate',
      estimatedReviewTimeSavedMinutes: 10,
      findings: [],
    };
  }

  // 6. Merge deterministic and LLM findings
  const allFindings = [...deterministicFindings, ...parsedLlmSummary.findings];

  // 7. Filter by enabled policy categories and severity threshold
  const minSeverityIndex = SEVERITY_ORDER.indexOf(params.policy.severityThreshold);
  const filteredFindings = allFindings.filter((finding) => {
    // Category check
    if (!params.policy.enabledCategories.includes(finding.category)) {
      return false;
    }
    // Severity threshold check
    const findingSevIndex = SEVERITY_ORDER.indexOf(finding.severity);
    if (findingSevIndex > minSeverityIndex) {
      return false; // Lower severity than threshold
    }
    return true;
  });

  // 8. Ground findings in parsed files and deduplicate
  const groundedFindings = validateAndGroundFindings(filteredFindings, parsedFiles);
  const dedupedFindings = deduplicateAndRankFindings(groundedFindings);

  // 9. Recalculate overall risk based on highest severity finding
  let calculatedRisk = parsedLlmSummary.overallRisk;
  const hasCritical = dedupedFindings.some((f) => f.severity === 'CRITICAL');
  const hasHigh = dedupedFindings.some((f) => f.severity === 'HIGH');
  if (hasCritical) calculatedRisk = 'CRITICAL';
  else if (hasHigh && calculatedRisk !== 'CRITICAL') calculatedRisk = 'HIGH';

  const finalSummary: ReviewSummary = {
    ...parsedLlmSummary,
    overallRisk: calculatedRisk,
    findings: dedupedFindings,
  };

  const durationSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
  // Blended rate ~$0.005 per 1K tokens
  const estimatedCostUsd = parseFloat(((llmResult.tokensUsed / 1000) * 0.005).toFixed(4));

  return {
    summary: finalSummary,
    tokensUsed: llmResult.tokensUsed,
    estimatedCostUsd,
    durationSeconds,
  };
}
