import { Router, Response } from 'express';
import { prisma } from '@reviewflow/database';
import { ReviewPolicySchema } from '@reviewflow/shared';
import { GitHubAppClient, MockGitHubAdapter, IGitHubAdapter } from '@reviewflow/github-client';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../../common/auth.middleware';
import { logger } from '../../common/logger';
import { enqueueReviewJob } from '../../common/queue';

export const repositoriesRouter = Router();
repositoriesRouter.use(authenticateToken);

function getGitHubAppClient(installationId?: number): GitHubAppClient | null {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY || 'github-app-private-key.pem';

  if (!appId || !privateKey) {
    return null;
  }

  try {
    return new GitHubAppClient({
      appId,
      privateKey,
      installationId,
    });
  } catch (err: any) {
    logger.error('Failed to initialize GitHubAppClient in repositoriesRouter', { error: err.message });
    return null;
  }
}

// GET /api/v1/repositories/app-info
repositoriesRouter.get('/app-info', async (_req: AuthenticatedRequest, res: Response) => {
  const appSlug = process.env.GITHUB_APP_SLUG || 'reviewflow-pr-assistant';
  const appId = process.env.GITHUB_APP_ID;
  const isConfigured = Boolean(appId && (process.env.GITHUB_PRIVATE_KEY || true));

  let availableInstallations: Array<{ id: number; accountLogin: string; accountType: string }> = [];
  const client = getGitHubAppClient();
  if (client) {
    try {
      const list = await client.listAppInstallations();
      availableInstallations = list.map((i) => ({
        id: i.id,
        accountLogin: (i.account as any)?.login || 'unknown',
        accountType: (i.account as any)?.type || 'User',
      }));
    } catch {
      // ignore
    }
  }

  res.json({
    data: {
      appSlug,
      appId: appId || null,
      installUrl: `https://github.com/apps/${appSlug}/installations/new`,
      isConfigured,
      availableInstallations,
    },
  });
});

// GET /api/v1/repositories/installations
repositoriesRouter.get('/installations', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  if (!orgId) {
    res.json({ data: [] });
    return;
  }

  const installations = await prisma.gitHubInstallation.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    data: installations.map((inst) => ({
      id: inst.id,
      installationId: inst.installationId,
      accountLogin: inst.accountLogin,
      accountType: inst.accountType,
      avatarUrl: inst.avatarUrl,
      createdAt: inst.createdAt,
    })),
  });
});

// POST /api/v1/repositories/installations/claim
repositoriesRouter.post(
  '/installations/claim',
  requireRole(['OWNER', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    const orgId = req.user!.organizationId;
    const { installationId } = req.body;

    const numericInstallationId = parseInt(String(installationId), 10);
    if (isNaN(numericInstallationId) || numericInstallationId <= 0) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Valid installationId is required.' } });
      return;
    }

    const client = getGitHubAppClient();
    if (!client) {
      res.status(500).json({
        error: { code: 'GITHUB_NOT_CONFIGURED', message: 'GitHub App credentials are not configured on the server.' },
      });
      return;
    }

    let targetInstallationId = numericInstallationId;
    const configuredAppId = parseInt(String(process.env.GITHUB_APP_ID || ''), 10);

    // If user entered their GitHub App ID instead of Installation ID, auto-resolve
    if (configuredAppId && numericInstallationId === configuredAppId) {
      try {
        const appInstallations = await client.listAppInstallations();
        if (appInstallations.length === 1) {
          targetInstallationId = appInstallations[0].id;
          logger.info('Auto-resolved App ID to unique Installation ID', {
            appId: configuredAppId,
            resolvedInstallationId: targetInstallationId,
          });
        }
      } catch (err: any) {
        logger.warn('Could not auto-list app installations when App ID was provided', { error: err.message });
      }
    }

    try {
      // 1. Verify existence of installation with GitHub API
      const details = await client.getInstallationDetails(targetInstallationId);
      const accountLogin = (details.account as any)?.login || 'unknown';
      const accountType = (details.account as any)?.type || 'Organization';
      const avatarUrl = (details.account as any)?.avatar_url || null;

      // 2. Check if already claimed by another organization
      const existing = await prisma.gitHubInstallation.findUnique({
        where: { installationId: targetInstallationId },
      });

      if (existing && existing.organizationId !== orgId) {
        res.status(409).json({
          error: {
            code: 'ALREADY_CLAIMED',
            message: 'This GitHub installation is already linked to another ReviewFlow organization.',
          },
        });
        return;
      }

      // 3. Upsert installation record scoped to current tenant
      const installation = await prisma.gitHubInstallation.upsert({
        where: { installationId: targetInstallationId },
        create: {
          organizationId: orgId,
          installationId: targetInstallationId,
          accountLogin,
          accountType,
          avatarUrl,
          permissions: JSON.stringify(details.permissions || {}),
        },
        update: {
          organizationId: orgId,
          accountLogin,
          accountType,
          avatarUrl,
          permissions: JSON.stringify(details.permissions || {}),
          updatedAt: new Date(),
        },
      });

      // 4. Fetch repositories accessible to this installation
      const availableRepos = await client.listInstallationRepositories(targetInstallationId);

      logger.info('Claimed GitHub installation for organization', {
        orgId,
        installationId: targetInstallationId,
        account: accountLogin,
        reposFound: availableRepos.length,
      });

      res.status(200).json({
        data: {
          installation,
          availableRepositories: availableRepos,
        },
      });
    } catch (err: any) {
      logger.error('Failed to claim GitHub installation', { error: err.message, installationId: targetInstallationId });

      let userFriendlyMessage = `Failed to verify installation with GitHub: ${err.message}`;
      if (err.status === 404 || String(err.message).includes('Not Found')) {
        try {
          const appInstallations = await client.listAppInstallations();
          if (appInstallations.length > 0) {
            const listStr = appInstallations.map((i) => `${i.id} (@${(i.account as any)?.login})`).join(', ');
            userFriendlyMessage = `Installation ID ${numericInstallationId} was not found on GitHub. Did you enter your App ID? Active installation ID(s) for your app: ${listStr}`;
          } else {
            userFriendlyMessage = `Installation ID ${numericInstallationId} was not found. Please install the GitHub App first on your account or organization.`;
          }
        } catch {
          // ignore
        }
      }

      res.status(502).json({
        error: {
          code: 'GITHUB_API_ERROR',
          message: userFriendlyMessage,
        },
      });
    }
  }
);

// DELETE /api/v1/repositories/installations/:installationId
repositoriesRouter.delete(
  '/installations/:installationId',
  requireRole(['OWNER', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    const orgId = req.user!.organizationId;
    const numericId = parseInt(req.params.installationId, 10);

    if (isNaN(numericId)) {
      res.status(400).json({ error: { code: 'INVALID_ID', message: 'Valid installationId is required.' } });
      return;
    }

    const installation = await prisma.gitHubInstallation.findFirst({
      where: {
        installationId: numericId,
        organizationId: orgId,
      },
    });

    if (!installation) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Installation not found for this organization.' } });
      return;
    }

    await prisma.gitHubInstallation.delete({
      where: { id: installation.id },
    });

    logger.info('Disconnected GitHub installation from organization', { orgId, installationId: numericId });
    res.json({ data: { disconnected: true } });
  }
);

// GET /api/v1/repositories/github-available
repositoriesRouter.get('/github-available', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  if (!orgId) {
    res.json({ data: [] });
    return;
  }

  const installations = await prisma.gitHubInstallation.findMany({
    where: { organizationId: orgId },
  });

  if (installations.length === 0) {
    res.json({ data: [] });
    return;
  }

  const client = getGitHubAppClient();
  if (!client) {
    res.status(500).json({
      error: { code: 'GITHUB_NOT_CONFIGURED', message: 'GitHub App is not configured on the server.' },
    });
    return;
  }

  const connectedRepos = await prisma.repository.findMany({
    where: { organizationId: orgId },
  });
  const connectedRepoMap = new Map(connectedRepos.map((r) => [r.githubRepoId, r]));

  const allAvailable: any[] = [];

  for (const inst of installations) {
    try {
      const repos = await client.listInstallationRepositories(inst.installationId);
      for (const r of repos) {
        const existing = connectedRepoMap.get(r.id);
        allAvailable.push({
          id: r.id,
          name: r.name,
          fullName: r.fullName,
          private: r.private,
          defaultBranch: r.defaultBranch,
          installationId: inst.installationId,
          accountLogin: inst.accountLogin,
          isConnected: Boolean(existing && existing.isActive && existing.autoReviewEnabled),
          existingRepositoryId: existing?.id || null,
        });
      }
    } catch (err: any) {
      logger.warn('Failed to fetch repositories for installation', {
        installationId: inst.installationId,
        error: err.message,
      });
    }
  }

  res.json({ data: allAvailable });
});

// POST /api/v1/repositories/toggle
repositoriesRouter.post(
  '/toggle',
  requireRole(['OWNER', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    const orgId = req.user!.organizationId;
    const { githubRepoId, fullName, name, owner, defaultBranch, isPrivate, enabled } = req.body;

    const numericRepoId = parseInt(String(githubRepoId), 10);
    if (isNaN(numericRepoId) || !fullName || !name) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'githubRepoId, fullName, and name required.' } });
      return;
    }

    if (enabled) {
      // Connect or enable repository
      const repo = await prisma.repository.upsert({
        where: { githubRepoId: numericRepoId },
        create: {
          organizationId: orgId,
          githubRepoId: numericRepoId,
          fullName,
          name,
          owner: owner || fullName.split('/')[0],
          defaultBranch: defaultBranch || 'main',
          isPrivate: Boolean(isPrivate),
          isActive: true,
          autoReviewEnabled: true,
        },
        update: {
          organizationId: orgId,
          fullName,
          name,
          isActive: true,
          autoReviewEnabled: true,
          updatedAt: new Date(),
        },
      });

      // Ensure default policy exists
      await prisma.reviewPolicy.upsert({
        where: {
          organizationId_repositoryId: {
            organizationId: orgId,
            repositoryId: repo.id,
          },
        },
        create: {
          organizationId: orgId,
          repositoryId: repo.id,
        },
        update: {},
      });

      logger.info('Enabled repository for automated review', { orgId, repo: fullName });
      res.json({ data: { enabled: true, repository: repo } });
    } else {
      // Disable repository
      const existing = await prisma.repository.findFirst({
        where: { githubRepoId: numericRepoId, organizationId: orgId },
      });

      if (existing) {
        await prisma.repository.update({
          where: { id: existing.id },
          data: { autoReviewEnabled: false },
        });
      }

      logger.info('Disabled repository for automated review', { orgId, repo: fullName });
      res.json({ data: { enabled: false } });
    }
  }
);

// GET /api/v1/repositories
repositoriesRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  if (!orgId) {
    res.json({ data: [] });
    return;
  }

  const repositories = await prisma.repository.findMany({
    where: { organizationId: orgId, autoReviewEnabled: true },
    include: {
      reviewPolicies: true,
      _count: {
        select: { pullRequests: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  res.json({
    data: repositories.map((repo) => ({
      id: repo.id,
      githubRepoId: repo.githubRepoId,
      fullName: repo.fullName,
      name: repo.name,
      owner: repo.owner,
      defaultBranch: repo.defaultBranch,
      isPrivate: repo.isPrivate,
      isActive: repo.isActive,
      autoReviewEnabled: repo.autoReviewEnabled,
      lastReviewAt: repo.lastReviewAt,
      pullRequestsCount: repo._count.pullRequests,
      policy: repo.reviewPolicies[0] || null,
      createdAt: repo.createdAt,
    })),
  });
});

// GET /api/v1/repositories/:id
repositoriesRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const repo = await prisma.repository.findFirst({
    where: {
      id: req.params.id,
      organizationId: req.user!.organizationId, // Tenant isolation
    },
    include: {
      reviewPolicies: true,
    },
  });

  if (!repo) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Repository not found or access denied.' } });
    return;
  }

  res.json({ data: repo });
});

// PATCH /api/v1/repositories/:id/policy
repositoriesRouter.patch(
  '/:id/policy',
  requireRole(['OWNER', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    const repo = await prisma.repository.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId,
      },
    });

    if (!repo) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Repository not found.' } });
      return;
    }

    const parseResult = ReviewPolicySchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: { code: 'VALIDATION_FAILED', details: parseResult.error.flatten() } });
      return;
    }

    const data = parseResult.data;

    // Upsert repo-specific policy
    const policy = await prisma.reviewPolicy.upsert({
      where: {
        organizationId_repositoryId: {
          organizationId: repo.organizationId,
          repositoryId: repo.id,
        },
      },
      create: {
        organizationId: repo.organizationId,
        repositoryId: repo.id,
        severityThreshold: data.severityThreshold || 'MEDIUM',
        blockPrOnCritical: data.blockPrOnCritical ?? true,
        autoPostInlineComments: data.autoPostInlineComments ?? true,
        autoCreateCheckRun: data.autoCreateCheckRun ?? true,
        requireTestsForNewCode: data.requireTestsForNewCode ?? true,
        maxDiffLines: data.maxDiffLines || 4000,
        customInstructions: data.customInstructions || '',
        enabledCategories: data.enabledCategories ? JSON.stringify(data.enabledCategories) : undefined,
        excludedPaths: data.excludedPaths ? JSON.stringify(data.excludedPaths) : undefined,
      },
      update: {
        severityThreshold: data.severityThreshold,
        blockPrOnCritical: data.blockPrOnCritical,
        autoPostInlineComments: data.autoPostInlineComments,
        autoCreateCheckRun: data.autoCreateCheckRun,
        requireTestsForNewCode: data.requireTestsForNewCode,
        maxDiffLines: data.maxDiffLines,
        customInstructions: data.customInstructions,
        enabledCategories: data.enabledCategories ? JSON.stringify(data.enabledCategories) : undefined,
        excludedPaths: data.excludedPaths ? JSON.stringify(data.excludedPaths) : undefined,
      },
    });

    res.json({ data: policy });
  }
);

// GET /api/v1/repositories/:id/pull-requests
repositoriesRouter.get('/:id/pull-requests', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const repo = await prisma.repository.findFirst({
    where: {
      id: req.params.id,
      organizationId: orgId, // Tenant isolation
    },
    include: {
      organization: {
        include: { installations: true },
      },
    },
  });

  if (!repo) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Repository not found or access denied.' } });
    return;
  }

  const installation = repo.organization.installations[0];
  const client = getGitHubAppClient(installation?.installationId);
  const adapter: IGitHubAdapter | null = client || (process.env.GITHUB_MOCK_MODE === 'true' ? new MockGitHubAdapter() : null);

  if (!adapter) {
    res.status(500).json({
      error: { code: 'GITHUB_NOT_CONFIGURED', message: 'GitHub credentials are not configured on the server.' },
    });
    return;
  }

  const state = ((req.query.state as string) || 'open').toLowerCase() as 'open' | 'closed' | 'all';
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 100);

  try {
    const ghPullRequests = await adapter.listPullRequests(repo.owner, repo.name, state, page, limit);

    // Fetch matching pull requests and their latest review jobs from DB
    const dbPrs = await prisma.pullRequest.findMany({
      where: {
        repositoryId: repo.id,
        number: { in: ghPullRequests.map((p) => p.number) },
      },
      include: {
        reviewJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            result: {
              include: {
                findings: {
                  select: { severity: true },
                },
              },
            },
          },
        },
      },
    });

    const dbPrMap = new Map(dbPrs.map((p) => [p.number, p]));

    const enrichedPrs = ghPullRequests.map((ghPr) => {
      const dbPr = dbPrMap.get(ghPr.number);
      const latestJob = dbPr?.reviewJobs[0];
      const findings = latestJob?.result?.findings || [];

      const isOutdated = latestJob ? latestJob.commitSha !== ghPr.headSha : false;

      return {
        id: dbPr?.id || null,
        githubPrId: ghPr.id,
        number: ghPr.number,
        title: ghPr.title,
        author: ghPr.author,
        authorAvatarUrl: ghPr.authorAvatarUrl || null,
        sourceBranch: ghPr.sourceBranch,
        targetBranch: ghPr.targetBranch,
        headSha: ghPr.headSha,
        state: ghPr.state,
        createdAt: ghPr.createdAt,
        updatedAt: ghPr.updatedAt,
        repositoryId: repo.id,
        repoFullName: repo.fullName,
        latestReview: latestJob
          ? {
              id: latestJob.id,
              status: latestJob.status,
              overallRisk: latestJob.result?.overallRisk || 'SAFE',
              commitSha: latestJob.commitSha,
              isOutdated,
              durationSeconds: latestJob.durationSeconds,
              totalFindings: findings.length,
              findingCounts: {
                CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
                HIGH: findings.filter((f) => f.severity === 'HIGH').length,
                MEDIUM: findings.filter((f) => f.severity === 'MEDIUM').length,
                LOW: findings.filter((f) => f.severity === 'LOW').length,
                INFO: findings.filter((f) => f.severity === 'INFO').length,
              },
              createdAt: latestJob.createdAt,
              completedAt: latestJob.completedAt,
            }
          : null,
      };
    });

    res.json({
      data: enrichedPrs,
      pagination: {
        page,
        limit,
        hasMore: ghPullRequests.length === limit,
      },
    });
  } catch (err: any) {
    logger.error('Failed to list GitHub pull requests for repository', {
      repo: repo.fullName,
      error: err.message,
    });
    res.status(502).json({
      error: {
        code: 'GITHUB_API_ERROR',
        message: `Failed to fetch pull requests from GitHub: ${err.message}`,
      },
    });
  }
});

// POST /api/v1/repositories/:id/pull-requests/:prNumber/review
repositoriesRouter.post(
  '/:id/pull-requests/:prNumber/review',
  async (req: AuthenticatedRequest, res: Response) => {
    const orgId = req.user!.organizationId;
    const prNumber = parseInt(req.params.prNumber, 10);
    const forceRerun = Boolean(req.body.forceRerun);

    if (isNaN(prNumber) || prNumber <= 0) {
      res.status(400).json({ error: { code: 'INVALID_PR_NUMBER', message: 'Valid PR number required.' } });
      return;
    }

    const repo = await prisma.repository.findFirst({
      where: {
        id: req.params.id,
        organizationId: orgId, // Tenant isolation
      },
      include: {
        organization: {
          include: { installations: true },
        },
      },
    });

    if (!repo) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Repository not found or access denied.' } });
      return;
    }

    const installation = repo.organization.installations[0];
    const client = getGitHubAppClient(installation?.installationId);
    const adapter: IGitHubAdapter | null = client || (process.env.GITHUB_MOCK_MODE === 'true' ? new MockGitHubAdapter() : null);

    if (!adapter) {
      res.status(500).json({
        error: { code: 'GITHUB_NOT_CONFIGURED', message: 'GitHub credentials are not configured on the server.' },
      });
      return;
    }

    try {
      // 1. Fetch real-time PR details directly from GitHub API
      const prDetails = await adapter.fetchPullRequest(repo.owner, repo.name, prNumber);

      if (prDetails.state !== 'open') {
        res.status(400).json({
          error: {
            code: 'PR_NOT_OPEN',
            message: `Pull request #${prNumber} is currently ${prDetails.state}. Only open pull requests can be reviewed.`,
          },
        });
        return;
      }

      // 2. Upsert Pull Request record in DB
      const pr = await prisma.pullRequest.upsert({
        where: {
          repositoryId_number: {
            repositoryId: repo.id,
            number: prDetails.number,
          },
        },
        create: {
          repositoryId: repo.id,
          githubPrId: prDetails.id,
          number: prDetails.number,
          title: prDetails.title || `Pull Request #${prDetails.number}`,
          author: prDetails.user?.login || 'unknown',
          authorAvatarUrl: prDetails.user?.avatarUrl || null,
          baseBranch: prDetails.base?.ref || 'main',
          headBranch: prDetails.head?.ref || 'feature',
          headSha: prDetails.head?.sha,
          state: 'OPEN',
        },
        update: {
          title: prDetails.title,
          headSha: prDetails.head?.sha,
          baseBranch: prDetails.base?.ref,
          headBranch: prDetails.head?.ref,
          state: 'OPEN',
          updatedAt: new Date(),
        },
      });

      // 3. Job Safety and Duplicate Prevention (Requirement 4)
      const existingJob = await prisma.reviewJob.findFirst({
        where: {
          pullRequestId: pr.id,
          commitSha: prDetails.head.sha,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          result: {
            include: { findings: true },
          },
        },
      });

      if (!forceRerun && existingJob) {
        if (['QUEUED', 'FETCHING_DIFF', 'ANALYZING', 'VALIDATING', 'PUBLISHING'].includes(existingJob.status)) {
          res.status(409).json({
            error: {
              code: 'REVIEW_ALREADY_RUNNING',
              message: `A review is already in progress for commit ${prDetails.head.sha.substring(0, 7)}.`,
            },
            data: {
              reviewJobId: existingJob.id,
              status: existingJob.status,
              pullRequestId: pr.id,
            },
          });
          return;
        }

        if (existingJob.status === 'COMPLETED') {
          res.status(200).json({
            data: {
              reviewJobId: existingJob.id,
              status: existingJob.status,
              alreadyReviewed: true,
              overallRisk: existingJob.result?.overallRisk || 'SAFE',
              message: `Commit ${prDetails.head.sha.substring(0, 7)} has already been reviewed. Set forceRerun=true to re-analyze.`,
            },
          });
          return;
        }
      }

      // 4. Supersede any older in-flight jobs on this PR
      await prisma.reviewJob.updateMany({
        where: {
          pullRequestId: pr.id,
          status: { in: ['QUEUED', 'FETCHING_DIFF', 'ANALYZING', 'VALIDATING', 'PUBLISHING'] },
        },
        data: {
          status: 'SUPERSEDED',
          statusMessage: `Superseded by on-demand review for commit ${prDetails.head.sha.substring(0, 7)}`,
          completedAt: new Date(),
        },
      });

      // 5. Create new ReviewJob
      const idempotencyKey = forceRerun
        ? `review-${pr.id}-${prDetails.head.sha}-rerun-${Date.now()}`
        : `review-${pr.id}-${prDetails.head.sha}`;

      const reviewJob = await prisma.reviewJob.create({
        data: {
          pullRequestId: pr.id,
          commitSha: prDetails.head.sha,
          status: 'QUEUED',
          idempotencyKey,
          statusMessage: 'Review job queued on demand by user.',
        },
      });

      // 6. Enqueue review job to background worker
      await enqueueReviewJob(reviewJob.id);

      logger.info('Enqueued on-demand review job for existing PR', {
        repo: repo.fullName,
        prNumber: pr.number,
        commitSha: prDetails.head.sha,
        jobId: reviewJob.id,
        forceRerun,
      });

      res.status(202).json({
        data: {
          message: 'Review job successfully enqueued for execution.',
          reviewJobId: reviewJob.id,
          pullRequestId: pr.id,
          prNumber: pr.number,
          commitSha: prDetails.head.sha,
          status: reviewJob.status,
        },
      });
    } catch (err: any) {
      logger.error('Failed to trigger on-demand review for PR', {
        repo: repo.fullName,
        prNumber,
        error: err.message,
      });
      res.status(502).json({
        error: {
          code: 'GITHUB_API_ERROR',
          message: `Failed to fetch PR from GitHub: ${err.message}`,
        },
      });
    }
  }
);
