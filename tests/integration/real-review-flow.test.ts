import test from 'node:test';
import assert from 'node:assert/strict';
import { runReviewPipeline } from '../../packages/ai-review/src/pipeline/review-pipeline';
import { GeminiProvider, ILlmProvider } from '../../packages/ai-review/src/providers/provider-adapter';
import { SAMPLE_DIFF_JWT_AUTH } from '../../packages/github-client/src/mock-github-adapter';
import { ReviewPolicySchema } from '../../packages/shared/src/schemas';

test('integration: live review pipeline executes structured review and calculates telemetry', async () => {
  const policy = ReviewPolicySchema.parse({
    severityThreshold: 'MEDIUM',
    blockPrOnCritical: true,
  });

  // Test provider that simulates real structured LLM response adhering to Zod schema
  const simulatedLiveProvider: ILlmProvider = {
    name: 'Google Gemini (Simulated Real)',
    async generateReview(_sys, _user) {
      return {
        rawResponse: JSON.stringify({
          summary: 'Verified code changes in auth service. Detected insecure hardcoded fallback cryptographic secret in JWT verification logic.',
          overallRisk: 'CRITICAL',
          riskRationale: 'Hardcoded secret enables unauthorized privilege escalation when environment variable is unset.',
          keyStrengths: ['Adopts HttpOnly cookie session architecture'],
          blockers: ['Remove insecure fallback secret from token verification'],
          testCoverageAssessment: 'Deficit: Missing unit test cases for expired refresh tokens',
          estimatedReviewTimeSavedMinutes: 30,
          findings: [
            {
              category: 'SECURITY',
              severity: 'CRITICAL',
              confidence: 96,
              filePath: 'src/services/token.service.ts',
              startLine: 42,
              endLine: 45,
              title: 'Cryptographic Secret Fallback Vulnerability',
              explanation: 'When process.env.JWT_REFRESH_SECRET is unset, the verification method falls back to a static string.',
              evidence: 'const secret = process.env.JWT_REFRESH_SECRET || "default-secret-do-not-use-in-prod";',
              remediation: 'Throw an explicit ConfigurationError if JWT_REFRESH_SECRET is missing.',
              suggestedPatch: 'if (!process.env.JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET is required");',
            },
          ],
        }),
        tokensUsed: 1850,
      };
    },
  };

  const result = await runReviewPipeline({
    repoName: 'acme-cloud/auth-service',
    prNumber: 142,
    prTitle: 'feat(auth): Add JWT refresh token rotation',
    diffText: SAMPLE_DIFF_JWT_AUTH,
    policy,
    llmProvider: simulatedLiveProvider,
  });

  assert.equal(result.summary.overallRisk, 'CRITICAL');
  assert.ok(result.summary.findings.length >= 1);
  const critical = result.summary.findings.find((f) => f.severity === 'CRITICAL');
  assert.ok(critical);
  assert.match(critical.filePath, /token\.service\.ts/);
  assert.ok(result.tokensUsed === 1850);
  assert.ok(result.estimatedCostUsd > 0);
  assert.ok(result.durationSeconds >= 0);
});

test('integration: GeminiProvider rejects empty API key visibly with configuration error', () => {
  assert.throws(
    () => {
      new GeminiProvider('');
    },
    {
      message: /GEMINI_API_KEY is not configured or empty/,
    }
  );
});
