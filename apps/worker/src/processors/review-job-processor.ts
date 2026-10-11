import { prisma } from '@reviewflow/database';
import { runReviewPipeline } from '@reviewflow/ai-review';
import { MockGitHubAdapter, IGitHubAdapter } from '@reviewflow/github-client';
import { ReviewPolicy, ReviewPolicySchema } from '@reviewflow/shared';

export interface ProcessReviewJobOptions {
  githubAdapter?: IGitHubAdapter;
}

export async function processReviewJob(jobId: string, options?: ProcessReviewJobOptions): Promise<void> {
  const github = options?.githubAdapter || new MockGitHubAdapter();

  const job = await prisma.reviewJob.findUnique({
    where: { id: jobId },
    include: {
      pullRequest: {
        include: {
          repository: {
            include: { reviewPolicies: true },
          },
        },
      },
    },
  });

  if (!job) {
    console.error(`[Worker] Job ${jobId} not found.`);
    return;
  }

  const { pullRequest } = job;
  const { repository } = pullRequest;

  console.log(`[Worker] Processing ReviewJob ${job.id} for ${repository.fullName}#${pullRequest.number}`);

  try {
    // 1. Commit SHA Validation: ensure the job's commit SHA is still the latest on the PR
    if (pullRequest.headSha !== job.commitSha) {
      console.warn(`[Worker] Commit SHA mismatch: job commit ${job.commitSha.substring(0, 7)} superseded by PR HEAD ${pullRequest.headSha.substring(0, 7)}`);
      await prisma.reviewJob.update({
        where: { id: job.id },
        data: {
          status: 'SUPERSEDED',
          statusMessage: 'Review cancelled because a newer commit was pushed to the pull request.',
        },
      });
      return;
    }

    // 2. Update status -> FETCHING_DIFF
    await prisma.reviewJob.update({
      where: { id: job.id },
      data: {
        status: 'FETCHING_DIFF',
        progressPercent: 20,
        statusMessage: 'Fetching git diff from GitHub...',
        startedAt: new Date(),
      },
    });

    // 3. Fetch PR diff
    const diffText = await github.fetchPullRequestDiff(repository.owner, repository.name, pullRequest.number);

    // 4. Update status -> ANALYZING
    await prisma.reviewJob.update({
      where: { id: job.id },
      data: {
        status: 'ANALYZING',
        progressPercent: 50,
        statusMessage: 'Running deterministic static analysis & AI evaluation...',
      },
    });

    // 5. Load and parse repository policy
    const policyRecord = repository.reviewPolicies[0];
    let policy: ReviewPolicy;
    if (policyRecord) {
      policy = {
        enabledCategories: JSON.parse(policyRecord.enabledCategories),
        severityThreshold: policyRecord.severityThreshold as ReviewPolicy['severityThreshold'],
        blockPrOnCritical: policyRecord.blockPrOnCritical,
        autoPostInlineComments: policyRecord.autoPostInlineComments,
        autoCreateCheckRun: policyRecord.autoCreateCheckRun,
        requireTestsForNewCode: policyRecord.requireTestsForNewCode,
        maxDiffLines: policyRecord.maxDiffLines,
        customInstructions: policyRecord.customInstructions,
        excludedPaths: JSON.parse(policyRecord.excludedPaths),
      };
    } else {
      policy = ReviewPolicySchema.parse({});
    }

    // 6. Run AI + Deterministic Review Pipeline
    const pipelineResult = await runReviewPipeline({
      repoName: repository.fullName,
      prNumber: pullRequest.number,
      prTitle: pullRequest.title,
      diffText,
      policy,
    });

    // 7. Update status -> VALIDATING
    await prisma.reviewJob.update({
      where: { id: job.id },
      data: {
        status: 'VALIDATING',
        progressPercent: 80,
        statusMessage: 'Validating findings and grounding evidence...',
      },
    });

    // 8. Persist ReviewResult and Findings
    const reviewResult = await prisma.reviewResult.create({
      data: {
        reviewJobId: job.id,
        summary: pipelineResult.summary.summary,
        overallRisk: pipelineResult.summary.overallRisk,
        riskRationale: pipelineResult.summary.riskRationale,
        keyStrengths: JSON.stringify(pipelineResult.summary.keyStrengths),
        blockers: JSON.stringify(pipelineResult.summary.blockers),
        testCoverageAssessment: pipelineResult.summary.testCoverageAssessment,
        estimatedReviewTimeSavedMinutes: pipelineResult.summary.estimatedReviewTimeSavedMinutes,
      },
    });

    if (pipelineResult.summary.findings.length > 0) {
      await prisma.finding.createMany({
        data: pipelineResult.summary.findings.map((f) => ({
          reviewResultId: reviewResult.id,
          category: f.category,
          severity: f.severity,
          confidence: f.confidence,
          filePath: f.filePath,
          startLine: f.startLine,
          endLine: f.endLine,
          title: f.title,
          explanation: f.explanation,
          evidence: f.evidence,
          remediation: f.remediation,
          suggestedPatch: f.suggestedPatch,
          ruleId: f.ruleId,
          source: f.source,
          dismissed: false,
        })),
      });
    }

    // 9. Publish to GitHub (Check Runs & Inline PR Comments)
    let checkRunId: string | undefined;
    if (policy.autoCreateCheckRun) {
      const isBlocked = policy.blockPrOnCritical && pipelineResult.summary.overallRisk === 'CRITICAL';
      checkRunId = await github.createCheckRun(repository.owner, repository.name, job.commitSha, 'ReviewFlow AI');
      await github.updateCheckRun(repository.owner, repository.name, checkRunId, {
        status: 'completed',
        conclusion: isBlocked ? 'failure' : 'success',
        title: `ReviewFlow AI: ${pipelineResult.summary.overallRisk} (${pipelineResult.summary.findings.length} findings)`,
        summary: pipelineResult.summary.summary,
      });
    }

    if (policy.autoPostInlineComments && pipelineResult.summary.findings.length > 0) {
      const inlineComments = pipelineResult.summary.findings.slice(0, 5).map((f) => ({
        path: f.filePath,
        line: f.startLine,
        body: `### [${f.severity}] ${f.title}\n\n${f.explanation}\n\n**Remediation:**\n${f.remediation}${
          f.suggestedPatch ? `\n\n\`\`\`suggestion\n${f.suggestedPatch}\n\`\`\`` : ''
        }`,
      }));

      await github.postReview(
        repository.owner,
        repository.name,
        pullRequest.number,
        job.commitSha,
        pipelineResult.summary.summary,
        inlineComments
      );
    }

    // 10. Update Usage record
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    await prisma.usageRecord.upsert({
      where: {
        organizationId_periodYear_periodMonth: {
          organizationId: repository.organizationId,
          periodYear: year,
          periodMonth: month,
        },
      },
      create: {
        organizationId: repository.organizationId,
        periodYear: year,
        periodMonth: month,
        reviewCount: 1,
        tokenCount: pipelineResult.tokensUsed,
        estimatedCostUsd: pipelineResult.estimatedCostUsd,
      },
      update: {
        reviewCount: { increment: 1 },
        tokenCount: { increment: pipelineResult.tokensUsed },
        estimatedCostUsd: { increment: pipelineResult.estimatedCostUsd },
      },
    });

    // 11. Complete Job
    await prisma.reviewJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        progressPercent: 100,
        statusMessage: `Review completed with ${pipelineResult.summary.findings.length} findings.`,
        completedAt: new Date(),
        durationSeconds: pipelineResult.durationSeconds,
        tokensUsed: pipelineResult.tokensUsed,
        estimatedCostUsd: pipelineResult.estimatedCostUsd,
        publishedToGitHub: true,
        githubCheckRunId: checkRunId,
      },
    });

    console.log(`[Worker] ✅ Finished ReviewJob ${job.id} in ${pipelineResult.durationSeconds}s (${pipelineResult.summary.findings.length} findings)`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Worker] ❌ Failed ReviewJob ${job.id}:`, err);
    await prisma.reviewJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        progressPercent: 100,
        errorMessage: errorMsg,
        completedAt: new Date(),
      },
    });
  }
}
