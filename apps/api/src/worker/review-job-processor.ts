import fs from 'fs';
import path from 'path';
import { prisma } from '@reviewflow/database';
import { runReviewPipeline, ILlmProvider, GeminiProvider, OpenAiProvider, MockLlmProvider } from '@reviewflow/ai-review';
import {
  IGitHubAdapter,
  GitHubAppClient,
  MockGitHubAdapter,
} from '@reviewflow/github-client';
import { ReviewPolicy, ReviewPolicySchema } from '@reviewflow/shared';

export interface ProcessReviewJobOptions {
  githubAdapter?: IGitHubAdapter;
  llmProvider?: ILlmProvider;
}

const DEFAULT_IGNORED_DIFF_PATTERNS = [
  /package-lock\.json$/i,
  /yarn\.lock$/i,
  /pnpm-lock\.yaml$/i,
  /composer\.lock$/i,
  /Cargo\.lock$/i,
  /Gemfile\.lock$/i,
  /poetry\.lock$/i,
  /\.min\.(js|css)$/i,
  /\.map$/i,
  /\.svg$/i,
  /\.png$/i,
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.ico$/i,
  /(^|\/)dist\//i,
  /(^|\/)build\//i,
  /(^|\/)\.next\//i,
  /(^|\/)coverage\//i,
];

function preprocessAndFilterDiff(
  rawDiff: string,
  excludedPaths: string[] = [],
  maxLines: number = 25000
): { filteredDiff: string; originalLineCount: number; filteredLineCount: number; wasTruncated: boolean } {
  const originalLineCount = rawDiff ? rawDiff.split('\n').length : 0;
  if (!rawDiff || typeof rawDiff !== 'string') {
    return { filteredDiff: rawDiff || '', originalLineCount: 0, filteredLineCount: 0, wasTruncated: false };
  }

  const fileDiffs = rawDiff.split(/^diff --git /m).filter(Boolean);
  const keptDiffChunks: string[] = [];
  let currentLines = 0;
  let wasTruncated = false;

  for (const fileChunk of fileDiffs) {
    const firstLine = fileChunk.split(/\r?\n/)[0] || '';
    const match = firstLine.match(/a\/(.+?)\s+b\/(.+)/);
    const filePath = match ? match[2] : '';

    const isExcluded =
      (filePath && excludedPaths.some((p) => p && filePath.includes(p))) ||
      DEFAULT_IGNORED_DIFF_PATTERNS.some((re) => re.test(filePath));

    if (isExcluded) {
      keptDiffChunks.push(
        `diff --git a/${filePath} b/${filePath}\n# [ReviewFlow: Excluded lockfile/generated/binary from AI review: ${filePath}]\n`
      );
      currentLines += 2;
      continue;
    }

    const chunkLines = fileChunk.split('\n').length;
    if (currentLines + chunkLines > maxLines) {
      wasTruncated = true;
      keptDiffChunks.push(
        `diff --git ${firstLine}\n# [ReviewFlow: Remaining diff omitted to stay within ${maxLines} lines policy limit]\n`
      );
      break;
    }

    keptDiffChunks.push(`diff --git ${fileChunk}`);
    currentLines += chunkLines;
  }

  const filteredDiff = keptDiffChunks.join('');
  const filteredLineCount = filteredDiff.split('\n').length;

  return {
    filteredDiff: filteredDiff || rawDiff,
    originalLineCount,
    filteredLineCount,
    wasTruncated,
  };
}

export async function processReviewJob(jobId: string, options?: ProcessReviewJobOptions): Promise<void> {
  const job = await prisma.reviewJob.findUnique({
    where: { id: jobId },
    include: {
      pullRequest: {
        include: {
          repository: {
            include: {
              reviewPolicies: true,
              organization: {
                include: { installations: true },
              },
            },
          },
        },
      },
    },
  });

  if (!job) {
    console.error(`[Worker] ReviewJob ${jobId} not found.`);
    return;
  }

  if (job.status === 'COMPLETED' || job.status === 'SUPERSEDED') {
    console.log(`[Worker] ReviewJob ${job.id} is already ${job.status}. Skipping.`);
    return;
  }

  // Atomically claim job from QUEUED to FETCHING_DIFF to prevent concurrent workers processing the same job
  const claimResult = await prisma.reviewJob.updateMany({
    where: {
      id: jobId,
      status: 'QUEUED',
    },
    data: {
      status: 'FETCHING_DIFF',
      startedAt: new Date(),
      progressPercent: 20,
      statusMessage: 'Claimed by worker for analysis...',
    },
  });

  if (claimResult.count === 0 && job.status === 'QUEUED') {
    console.log(`[Worker] ReviewJob ${jobId} was already claimed by another concurrent worker. Skipping.`);
    return;
  }

  const { pullRequest } = job;
  const { repository } = pullRequest;

  console.log(`[Worker] Processing ReviewJob ${job.id} for ${repository.fullName}#${pullRequest.number}`);

  try {
    // 1. Resolve GitHub Adapter
    let github: IGitHubAdapter;
    if (options?.githubAdapter) {
      github = options.githubAdapter;
    } else {
      const appId = process.env.GITHUB_APP_ID;
      let privateKey = process.env.GITHUB_PRIVATE_KEY || 'github-app-private-key.pem';
      if (privateKey && (privateKey.startsWith('SHA256:') || privateKey.startsWith('"SHA256:'))) {
        privateKey = 'github-app-private-key.pem';
      }

      const installation =
        repository.organization?.installations?.find(
          (i) => i.accountLogin.toLowerCase() === repository.owner.toLowerCase()
        ) || repository.organization?.installations?.[0];

      if (appId && privateKey) {
        github = new GitHubAppClient({
          appId,
          privateKey,
          installationId: installation?.installationId,
        });
      } else if (process.env.GITHUB_MOCK_MODE !== 'false' && process.env.NODE_ENV !== 'production') {
        console.warn(
          `[Worker] Using MockGitHubAdapter (GITHUB_APP_ID/GITHUB_PRIVATE_KEY not configured in development).`
        );
        github = new MockGitHubAdapter();
      } else {
        throw new Error(
          'Configuration Error: Missing GITHUB_APP_ID or GITHUB_PRIVATE_KEY. Production/live mode requires real GitHub App credentials.'
        );
      }
    }

    // 2. Resolve LLM Provider
    let llmProvider: ILlmProvider;
    if (options?.llmProvider) {
      llmProvider = options.llmProvider;
    } else {
      const geminiKey = process.env.GEMINI_API_KEY;
      const openAiKey = process.env.OPENAI_API_KEY;
      const configuredProvider = process.env.AI_PROVIDER?.toLowerCase();

      if (geminiKey && geminiKey.trim() !== '') {
        const model = process.env.AI_MODEL_GEMINI || 'gemini-3.5-flash';
        console.log(`[Worker] Using Google Gemini LLM provider (model: ${model})`);
        llmProvider = new GeminiProvider(geminiKey, model);
      } else if (openAiKey && openAiKey.trim() !== '') {
        const model = process.env.AI_MODEL_OPENAI || 'gpt-4o';
        console.log(`[Worker] Using OpenAI LLM provider (model: ${model})`);
        llmProvider = new OpenAiProvider(openAiKey, model);
      } else if (configuredProvider === 'mock' && process.env.NODE_ENV !== 'production') {
        console.warn(`[Worker] Using MockLlmProvider for local testing.`);
        llmProvider = new MockLlmProvider();
      } else {
        throw new Error(
          'Configuration Error: No AI provider credentials configured. Please set GEMINI_API_KEY (or OPENAI_API_KEY) in environment.'
        );
      }
    }

    // 3. Commit SHA Validation
    if (pullRequest.headSha !== job.commitSha) {
      console.warn(
        `[Worker] Commit SHA mismatch: job commit ${job.commitSha.substring(0, 7)} superseded by PR HEAD ${pullRequest.headSha.substring(0, 7)}`
      );
      await prisma.reviewJob.update({
        where: { id: job.id },
        data: {
          status: 'SUPERSEDED',
          statusMessage: 'Review cancelled because a newer commit was pushed to the pull request.',
          completedAt: new Date(),
        },
      });
      return;
    }

    // 4. Update status -> FETCHING_DIFF
    await prisma.reviewJob.update({
      where: { id: job.id },
      data: {
        status: 'FETCHING_DIFF',
        progressPercent: 20,
        statusMessage: 'Fetching git diff from GitHub...',
        startedAt: new Date(),
      },
    });

    // 5. Fetch PR diff
    const diffText = await github.fetchPullRequestDiff(repository.owner, repository.name, pullRequest.number);

    // 6. Update status -> ANALYZING
    await prisma.reviewJob.update({
      where: { id: job.id },
      data: {
        status: 'ANALYZING',
        progressPercent: 50,
        statusMessage: `Running deterministic static analysis & ${llmProvider.name} reasoning...`,
      },
    });

    // 7. Load and parse repository policy
    const policyRecord = repository.reviewPolicies[0];
    let policy: ReviewPolicy;
    if (policyRecord) {
      try {
        policy = {
          enabledCategories: JSON.parse(policyRecord.enabledCategories),
          severityThreshold: policyRecord.severityThreshold as ReviewPolicy['severityThreshold'],
          blockPrOnCritical: policyRecord.blockPrOnCritical,
          autoPostInlineComments: policyRecord.autoPostInlineComments,
          autoCreateCheckRun: policyRecord.autoCreateCheckRun,
          requireTestsForNewCode: policyRecord.requireTestsForNewCode,
          maxDiffLines: policyRecord.maxDiffLines || 25000,
          customInstructions: policyRecord.customInstructions,
          excludedPaths: JSON.parse(policyRecord.excludedPaths),
        };
      } catch {
        policy = ReviewPolicySchema.parse({});
      }
    } else {
      policy = ReviewPolicySchema.parse({});
    }

    // Preprocess and filter diff: strip generated/lock files and prune to policy limit
    const maxAllowed = policy.maxDiffLines || 25000;
    const { filteredDiff, originalLineCount, filteredLineCount, wasTruncated } = preprocessAndFilterDiff(
      diffText,
      policy.excludedPaths,
      maxAllowed
    );

    console.log(
      `[Worker] Diff preprocessed: ${originalLineCount} raw lines -> ${filteredLineCount} lines filtered (limit: ${maxAllowed}, truncated: ${wasTruncated})`
    );

    // 8. Run AI + Deterministic Review Pipeline
    const pipelineResult = await runReviewPipeline({
      repoName: repository.fullName,
      prNumber: pullRequest.number,
      prTitle: pullRequest.title,
      diffText: filteredDiff,
      policy,
      llmProvider,
    });

    if (wasTruncated) {
      pipelineResult.summary.summary =
        `> ℹ️ **Notice**: This pull request contained ${originalLineCount.toLocaleString()} total diff lines. Generated/lock files were excluded and analysis was focused on the primary ${filteredLineCount.toLocaleString()} lines of source changes.\n\n` +
        pipelineResult.summary.summary;
    }

    // 9. Update status -> VALIDATING
    await prisma.reviewJob.update({
      where: { id: job.id },
      data: {
        status: 'VALIDATING',
        progressPercent: 80,
        statusMessage: 'Validating findings and grounding evidence against diff hunk boundaries...',
      },
    });

    // Clean up previous results for this job if retrying
    await prisma.finding.deleteMany({
      where: { reviewResult: { reviewJobId: job.id } },
    });
    await prisma.reviewResult.deleteMany({
      where: { reviewJobId: job.id },
    });

    // 10. Persist ReviewResult and Findings
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
          suggestedPatch: f.suggestedPatch || null,
          ruleId: f.ruleId || null,
          source: f.source,
          dismissed: false,
        })),
      });
    }

    // 11. Re-verify HEAD SHA before publishing to GitHub
    try {
      const freshPr = await github.fetchPullRequest(repository.owner, repository.name, pullRequest.number);
      if (freshPr.head.sha !== job.commitSha) {
        console.warn(
          `[Worker] PR HEAD changed from ${job.commitSha.substring(0, 7)} to ${freshPr.head.sha.substring(0, 7)} during review. Aborting publish and marking job SUPERSEDED.`
        );
        await prisma.pullRequest.update({
          where: { id: pullRequest.id },
          data: { headSha: freshPr.head.sha },
        });
        await prisma.reviewJob.update({
          where: { id: job.id },
          data: {
            status: 'SUPERSEDED',
            statusMessage: `Review result outdated: PR received newer commit ${freshPr.head.sha.substring(0, 7)} before publishing.`,
            completedAt: new Date(),
          },
        });
        return;
      }
    } catch (err: any) {
      console.warn(`[Worker] Pre-publish PR HEAD validation notice: ${err?.message}`);
    }

    // 12. Update status -> PUBLISHING
    await prisma.reviewJob.update({
      where: { id: job.id },
      data: {
        status: 'PUBLISHING',
        progressPercent: 90,
        statusMessage: 'Publishing Check Run and inline code review comments to GitHub...',
      },
    });

    // 13. Publish to GitHub (Check Runs & Inline PR Comments)
    let checkRunId: string | undefined;
    if (policy.autoCreateCheckRun) {
      try {
        const isBlocked = policy.blockPrOnCritical && pipelineResult.summary.overallRisk === 'CRITICAL';
        checkRunId = await github.createCheckRun(repository.owner, repository.name, job.commitSha, 'ReviewFlow AI');
        await github.updateCheckRun(repository.owner, repository.name, checkRunId, {
          status: 'completed',
          conclusion: isBlocked ? 'failure' : 'success',
          title: `ReviewFlow AI: ${pipelineResult.summary.overallRisk} (${pipelineResult.summary.findings.length} findings)`,
          summary: pipelineResult.summary.summary,
        });
      } catch (err: any) {
        console.warn(`[Worker] GitHub Check Run creation notice: ${err?.message}`);
      }
    }

    if (policy.autoPostInlineComments && pipelineResult.summary.findings.length > 0) {
      try {
        const inlineComments = pipelineResult.summary.findings.slice(0, 10).map((f) => ({
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
      } catch (err: any) {
        console.warn(`[Worker] GitHub inline review comments notice: ${err?.message}`);
      }
    }

    // 14. Update Organization Usage record
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

    // 15. Complete Job with real duration and telemetry
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
        publishedToGitHub: Boolean(checkRunId),
        githubCheckRunId: checkRunId || null,
        errorMessage: null,
      },
    });

    console.log(
      `[Worker] ✅ Finished ReviewJob ${job.id} in ${pipelineResult.durationSeconds}s (${pipelineResult.summary.findings.length} findings)`
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Worker] ❌ Failed ReviewJob ${job.id}:`, errorMsg);

    // Guard against overwriting an already COMPLETED job from a parallel execution
    const currentJob = await prisma.reviewJob.findUnique({
      where: { id: job.id },
      select: { status: true },
    });

    if (currentJob?.status === 'COMPLETED') {
      console.log(`[Worker] ReviewJob ${job.id} was already completed successfully. Skipping FAILED status overwrite.`);
      return;
    }

    await prisma.reviewJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        progressPercent: 100,
        errorMessage: errorMsg,
        statusMessage: `Review failed: ${errorMsg}`,
        completedAt: new Date(),
      },
    });
  }
}

