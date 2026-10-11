import test from 'node:test';
import assert from 'node:assert/strict';
import { runReviewPipeline } from '../../packages/ai-review/src/pipeline/review-pipeline';
import { SAMPLE_DIFF_JWT_AUTH } from '../../packages/github-client/src/mock-github-adapter';
import { ReviewPolicySchema, ReviewSummarySchema } from '../../packages/shared/src/schemas';

test('integration: end-to-end review pipeline on JWT auth sample diff', async () => {
  const policy = ReviewPolicySchema.parse({
    severityThreshold: 'MEDIUM',
    blockPrOnCritical: true,
  });

  const result = await runReviewPipeline({
    repoName: 'acme-cloud/auth-service',
    prNumber: 142,
    prTitle: 'feat(auth): Add JWT refresh token rotation',
    diffText: SAMPLE_DIFF_JWT_AUTH,
    policy,
  });

  // 1. Validate complete output against Zod schema
  const parsed = ReviewSummarySchema.safeParse(result.summary);
  assert.equal(parsed.success, true, 'Output must pass strict Zod ReviewSummarySchema validation');

  // 2. Validate findings grounded in source
  assert.ok(result.summary.findings.length >= 2, 'Should have multiple findings');
  const criticalFinding = result.summary.findings.find((f) => f.severity === 'CRITICAL');
  assert.ok(criticalFinding, 'Should have identified CRITICAL finding');
  assert.match(criticalFinding.filePath, /token\.service\.ts/);
  assert.ok(criticalFinding.confidence >= 90, 'Confidence score should be >= 90');

  // 3. Verify duration & tokens calculation
  assert.ok(result.durationSeconds >= 0, 'Duration must be positive');
  assert.ok(result.tokensUsed > 0, 'Tokens used must be positive');
  assert.ok(result.estimatedCostUsd >= 0, 'Estimated cost must be positive');
});
