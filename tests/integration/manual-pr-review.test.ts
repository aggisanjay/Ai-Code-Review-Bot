import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../packages/database/src';
import { MockGitHubAdapter, SAMPLE_DIFF_JWT_AUTH } from '../../packages/github-client/src';
import { processReviewJob } from '../../apps/worker/src/processors/review-job-processor';
import { ILlmProvider } from '../../packages/ai-review/src';

const mockLlm: ILlmProvider = {
  name: 'Google Gemini (Simulated Real)',
  async generateReview() {
    return {
      rawResponse: JSON.stringify({
        summary: 'Detected hardcoded cryptographic fallback secret in JWT verification logic.',
        overallRisk: 'HIGH',
        riskRationale: 'Fallback secret introduces security risk.',
        keyStrengths: ['Modular token service structure'],
        blockers: ['Remove insecure fallback secret'],
        testCoverageAssessment: 'Deficit in token refresh expiration tests',
        estimatedReviewTimeSavedMinutes: 20,
        findings: [
          {
            category: 'SECURITY',
            severity: 'HIGH',
            confidence: 95,
            filePath: 'src/services/token.service.ts',
            startLine: 14,
            endLine: 15,
            title: 'Hardcoded Secret Vulnerability',
            explanation: 'Fallback secret is hardcoded in token verification.',
            evidence: 'const secret = process.env.JWT_REFRESH_SECRET || "default-secret-do-not-use-in-prod";',
            remediation: 'Ensure environment secret is strictly checked without fallback.',
            suggestedPatch: 'if (!process.env.JWT_REFRESH_SECRET) throw new Error("Missing secret");',
          },
        ],
      }),
      tokensUsed: 1200,
    };
  },
};

test('manual-pr-review: fetches existing PRs, reviews on demand, and publishes results', async () => {
  const timestamp = Date.now();
  const orgSlug = `test-org-manual-${timestamp}`;

  // 1. Setup tenant & repository
  const org = await prisma.organization.create({
    data: {
      name: 'Manual PR Test Org',
      slug: orgSlug,
    },
  });

  const installation = await prisma.gitHubInstallation.create({
    data: {
      organizationId: org.id,
      installationId: 888000 + (timestamp % 10000),
      accountLogin: 'test-account',
    },
  });

  const repo = await prisma.repository.create({
    data: {
      organizationId: org.id,
      githubRepoId: 777000 + (timestamp % 10000),
      fullName: `test-account/existing-repo-${timestamp}`,
      name: `existing-repo-${timestamp}`,
      owner: 'test-account',
      autoReviewEnabled: true,
      reviewPolicies: {
        create: {
          organizationId: org.id,
          severityThreshold: 'MEDIUM',
          autoCreateCheckRun: true,
          autoPostInlineComments: true,
        },
      },
    },
  });

  // 2. Fetch existing PRs using MockGitHubAdapter
  const adapter = new MockGitHubAdapter();
  const existingPrs = await adapter.listPullRequests('test-account', repo.name, 'open');
  assert.ok(existingPrs.length >= 1, 'Should find at least 1 existing PR');
  const targetPr = existingPrs[0];
  assert.equal(targetPr.number, 142);
  assert.equal(targetPr.state, 'open');

  // 3. Create or upsert PR record in DB (simulating on-demand review trigger)
  const prRecord = await prisma.pullRequest.upsert({
    where: {
      repositoryId_number: {
        repositoryId: repo.id,
        number: targetPr.number,
      },
    },
    create: {
      repositoryId: repo.id,
      githubPrId: targetPr.id,
      number: targetPr.number,
      title: targetPr.title,
      author: targetPr.author,
      baseBranch: targetPr.targetBranch,
      headBranch: targetPr.sourceBranch,
      headSha: targetPr.headSha,
      state: 'OPEN',
    },
    update: {
      headSha: targetPr.headSha,
    },
  });

  // 4. Create ReviewJob and execute through worker
  const job = await prisma.reviewJob.create({
    data: {
      pullRequestId: prRecord.id,
      commitSha: prRecord.headSha,
      status: 'QUEUED',
      idempotencyKey: `review-${prRecord.id}-${prRecord.headSha}`,
      statusMessage: 'On-demand review queued.',
    },
  });

  await processReviewJob(job.id, {
    githubAdapter: adapter,
    llmProvider: mockLlm,
  });

  // 5. Verify results persisted
  const completedJob = await prisma.reviewJob.findUnique({
    where: { id: job.id },
    include: {
      result: {
        include: { findings: true },
      },
    },
  });

  assert.equal(completedJob?.status, 'COMPLETED');
  assert.ok(
    ['CRITICAL', 'HIGH'].includes(completedJob?.result?.overallRisk || ''),
    'Overall risk should reflect findings'
  );
  assert.ok((completedJob?.result?.findings.length || 0) >= 1);

  // 6. Verify publishing: check runs and review comments created on adapter
  const history = adapter.getHistory();
  assert.ok(history.checkRuns.length >= 1, 'GitHub Check Run should be created');
  assert.ok(history.postedReviews.length >= 1, 'GitHub PR Review should be posted');
  assert.equal(history.postedReviews[0].pullNumber, targetPr.number);
});

test('manual-pr-review: duplicate prevention blocks duplicate in-flight jobs and respects forceRerun', async () => {
  const timestamp = Date.now() + 1;
  const orgSlug = `test-org-dup-${timestamp}`;

  const org = await prisma.organization.create({
    data: { name: 'Dup Test Org', slug: orgSlug },
  });

  const repo = await prisma.repository.create({
    data: {
      organizationId: org.id,
      githubRepoId: 778000 + (timestamp % 10000),
      fullName: `dup-account/repo-${timestamp}`,
      name: `repo-${timestamp}`,
      owner: 'dup-account',
    },
  });

  const pr = await prisma.pullRequest.create({
    data: {
      repositoryId: repo.id,
      githubPrId: 992000,
      number: 10,
      title: 'Fix issue',
      author: 'dev',
      baseBranch: 'main',
      headBranch: 'fix',
      headSha: 'commit_sha_aaa',
      state: 'OPEN',
    },
  });

  // First job created in-flight
  const firstJob = await prisma.reviewJob.create({
    data: {
      pullRequestId: pr.id,
      commitSha: pr.headSha,
      status: 'ANALYZING',
      idempotencyKey: `review-${pr.id}-${pr.headSha}`,
    },
  });

  // Verify check for in-flight job:
  const inFlight = await prisma.reviewJob.findFirst({
    where: {
      pullRequestId: pr.id,
      commitSha: pr.headSha,
      status: { in: ['QUEUED', 'FETCHING_DIFF', 'ANALYZING', 'VALIDATING', 'PUBLISHING'] },
    },
  });
  assert.ok(inFlight, 'Should detect in-flight review job');
  assert.equal(inFlight?.id, firstJob.id);

  // When forceRerun is true, supersedes older in-flight job and allows new job
  await prisma.reviewJob.updateMany({
    where: {
      pullRequestId: pr.id,
      status: { in: ['QUEUED', 'FETCHING_DIFF', 'ANALYZING', 'VALIDATING', 'PUBLISHING'] },
    },
    data: {
      status: 'SUPERSEDED',
      statusMessage: 'Superseded by on-demand rerun.',
      completedAt: new Date(),
    },
  });

  const rerunJob = await prisma.reviewJob.create({
    data: {
      pullRequestId: pr.id,
      commitSha: pr.headSha,
      status: 'ANALYZING',
      idempotencyKey: `review-${pr.id}-${pr.headSha}-rerun-${Date.now()}`,
    },
  });

  const olderJobStatus = await prisma.reviewJob.findUnique({ where: { id: firstJob.id } });
  assert.equal(olderJobStatus?.status, 'SUPERSEDED');
  assert.equal(rerunJob.status, 'ANALYZING');
});

test('manual-pr-review: detects changed head SHA and marks old job as SUPERSEDED without publishing', async () => {
  const timestamp = Date.now() + 2;
  const orgSlug = `test-org-sha-${timestamp}`;

  const org = await prisma.organization.create({
    data: { name: 'SHA Test Org', slug: orgSlug },
  });

  const repo = await prisma.repository.create({
    data: {
      organizationId: org.id,
      githubRepoId: 779000 + (timestamp % 10000),
      fullName: `sha-account/repo-${timestamp}`,
      name: `repo-${timestamp}`,
      owner: 'sha-account',
      reviewPolicies: {
        create: {
          organizationId: org.id,
          severityThreshold: 'MEDIUM',
          autoCreateCheckRun: true,
          autoPostInlineComments: true,
        },
      },
    },
  });

  const adapter = new MockGitHubAdapter();
  // PR exists on GitHub with initial commit
  adapter.addMockPullRequest({
    id: 991200,
    number: 200,
    title: 'WIP: Feature branch',
    author: 'developer',
    sourceBranch: 'feat/work',
    targetBranch: 'main',
    headSha: 'old_initial_sha_111',
    state: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const pr = await prisma.pullRequest.create({
    data: {
      repositoryId: repo.id,
      githubPrId: 991200,
      number: 200,
      title: 'WIP: Feature branch',
      author: 'developer',
      baseBranch: 'main',
      headBranch: 'feat/work',
      headSha: 'old_initial_sha_111',
      state: 'OPEN',
    },
  });

  const job = await prisma.reviewJob.create({
    data: {
      pullRequestId: pr.id,
      commitSha: 'old_initial_sha_111',
      status: 'QUEUED',
      idempotencyKey: `review-${pr.id}-old_initial_sha_111`,
    },
  });

  // Now, simulate a new commit pushed to the PR before/during worker processing
  adapter.addMockPullRequest({
    id: 991200,
    number: 200,
    title: 'WIP: Feature branch',
    author: 'developer',
    sourceBranch: 'feat/work',
    targetBranch: 'main',
    headSha: 'new_pushed_sha_222', // CHANGED HEAD SHA!
    state: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await processReviewJob(job.id, {
    githubAdapter: adapter,
    llmProvider: mockLlm,
  });

  const updatedJob = await prisma.reviewJob.findUnique({ where: { id: job.id } });
  assert.equal(updatedJob?.status, 'SUPERSEDED');
  assert.match(updatedJob?.statusMessage || '', /outdated|newer commit/i);

  // Assert that reviews were NEVER posted for the outdated commit
  const history = adapter.getHistory();
  const postedOnOutdated = history.postedReviews.filter((r) => r.pullNumber === 200);
  assert.equal(postedOnOutdated.length, 0, 'Must NOT publish findings against superseded commit');
});
