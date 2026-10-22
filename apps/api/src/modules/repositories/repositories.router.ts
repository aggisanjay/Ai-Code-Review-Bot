import crypto from 'crypto';
import { Router, Response } from 'express';
import { prisma } from '@reviewflow/database';
import { ReviewPolicySchema } from '@reviewflow/shared';
import { GitHubAppClient, MockGitHubAdapter, IGitHubAdapter } from '@reviewflow/github-client';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../../common/auth.middleware';
import { logger } from '../../common/logger';
import { enqueueReviewJob, enqueueIndexJob } from '../../common/queue';
import { checkAndIncrementReviewQuota, checkAndIncrementQnAQuota } from '../billing/quota.service';
import {
  askCodebaseQuestion,
  generateTestSuggestion,
  GeminiProvider,
  OpenAiProvider,
  MockLlmProvider,
  GeminiEmbeddingProvider,
  OpenAiEmbeddingProvider,
  MockEmbeddingProvider,
  ILlmProvider,
  IEmbeddingProvider,
  CODE_ASSISTANT_TOOLS,
} from '@reviewflow/ai-review';

export const repositoriesRouter = Router();
repositoriesRouter.use(authenticateToken);

function getGitHubAppClient(installationId?: number): GitHubAppClient | null {
  const appId = process.env.GITHUB_APP_ID;
  let privateKey = process.env.GITHUB_PRIVATE_KEY || 'github-app-private-key.pem';

  if (privateKey && (privateKey.startsWith('SHA256:') || privateKey.startsWith('"SHA256:'))) {
    privateKey = 'github-app-private-key.pem';
  }

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

/**
 * Automatically sync and resolve the active GitHub installation ID for an account/owner.
 * If an installation was deleted/recreated on GitHub, this queries GitHub App API (via JWT),
 * finds the new installation, updates the database, and returns the fresh installation ID.
 */
async function resolveActiveInstallation(
  orgId: string,
  accountLoginOrOwner?: string,
  failedInstallationId?: number
): Promise<number | null> {
  const rootClient = getGitHubAppClient();
  if (!rootClient) return null;

  try {
    const activeInstallations = await rootClient.listAppInstallations();
    if (!activeInstallations || activeInstallations.length === 0) {
      return null;
    }

    let matched = activeInstallations.find((inst) =>
      accountLoginOrOwner
        ? inst.account?.login?.toLowerCase() === accountLoginOrOwner.toLowerCase()
        : false
    );

    // If only one installation exists for this app, fallback to it
    if (!matched && activeInstallations.length === 1) {
      matched = activeInstallations[0];
    }

    if (matched) {
      logger.info('Auto-resolved and synchronized GitHub installation ID', {
        orgId,
        oldId: failedInstallationId,
        newId: matched.id,
        account: matched.account?.login,
      });

      if (failedInstallationId && failedInstallationId !== matched.id) {
        await prisma.gitHubInstallation.deleteMany({
          where: { installationId: failedInstallationId },
        });
      }

      await prisma.gitHubInstallation.upsert({
        where: { installationId: matched.id },
        create: {
          organizationId: orgId,
          installationId: matched.id,
          accountLogin: matched.account?.login || accountLoginOrOwner || 'unknown',
          accountType: matched.account?.type || 'User',
          avatarUrl: matched.account?.avatar_url || null,
          permissions: JSON.stringify(matched.permissions || {}),
        },
        update: {
          organizationId: orgId,
          accountLogin: matched.account?.login || accountLoginOrOwner || 'unknown',
          avatarUrl: matched.account?.avatar_url || null,
          permissions: JSON.stringify(matched.permissions || {}),
          updatedAt: new Date(),
        },
      });

      return matched.id;
    }
  } catch (err: any) {
    logger.warn('Failed to auto-resolve active GitHub installation', { error: err.message });
  }

  return null;
}

// GET /api/v1/repositories/app-info
repositoriesRouter.get('/app-info', async (_req: AuthenticatedRequest, res: Response) => {
  let appSlug = process.env.GITHUB_APP_SLUG || 'reviewflow-ai';
  let appName = 'ReviewFlow AI';
  const appId = process.env.GITHUB_APP_ID;
  const isConfigured = Boolean(appId && process.env.GITHUB_PRIVATE_KEY);

  const client = getGitHubAppClient();
  if (client) {
    try {
      const appInfo = await client.getAppInfo();
      if (appInfo.slug) appSlug = appInfo.slug;
      if (appInfo.name) appName = appInfo.name;
    } catch {
      // ignore
    }
  }

  const aiProvider = process.env.AI_PROVIDER || 'gemini';
  const aiModel =
    process.env.AI_PROVIDER === 'openai'
      ? process.env.AI_MODEL_OPENAI || 'gpt-4o'
      : process.env.AI_MODEL_GEMINI || 'gemini-3.5-flash';

  res.json({
    data: {
      appSlug,
      appName,
      appId: appId || null,
      installUrl: `https://github.com/apps/${appSlug}/installations/new`,
      isConfigured,
      aiProvider,
      aiModel,
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

// POST /api/v1/repositories/installations/initiate
// Generates a cryptographically secure, single-use state token bound to (userId, orgId)
repositoriesRouter.post(
  '/installations/initiate',
  requireRole(['OWNER', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    const orgId = req.user!.organizationId;
    const userId = req.user!.id;

    if (!orgId) {
      res.status(400).json({ error: { code: 'NO_ORG', message: 'User must belong to an organization.' } });
      return;
    }

    const client = getGitHubAppClient();
    let appSlug = process.env.GITHUB_APP_SLUG || 'reviewflow-ai';
    if (client) {
      try {
        const appInfo = await client.getAppInfo();
        if (appInfo.slug) {
          appSlug = appInfo.slug;
        }
      } catch (err: any) {
        logger.warn('Could not retrieve app slug dynamically from GitHub', { error: err.message });
      }
    }

    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

    await prisma.installationState.create({
      data: {
        state,
        organizationId: orgId,
        userId,
        expiresAt,
      },
    });

    const installUrl = `https://github.com/apps/${appSlug}/installations/new?state=${state}`;

    logger.info('Initiated secure GitHub installation flow', {
      orgId,
      userId,
      appSlug,
      statePrefix: state.substring(0, 8),
    });

    res.json({
      data: {
        state,
        installUrl,
        expiresAt,
      },
    });
  }
);

// POST /api/v1/repositories/installations/claim
repositoriesRouter.post(
  '/installations/claim',
  requireRole(['OWNER', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    const orgId = req.user!.organizationId;
    const { installationId, state } = req.body;

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

    const targetInstallationId = numericInstallationId;

    // Check if installation is already linked to prevent duplicate setup and cross-tenant hijacking
    const existing = await prisma.gitHubInstallation.findUnique({
      where: { installationId: targetInstallationId },
    });

    if (existing) {
      if (existing.organizationId === orgId) {
        // Idempotent: already linked to current organization, return connected repos
        const availableRepos = await client.listInstallationRepositories(targetInstallationId).catch(() => []);
        return res.status(200).json({
          data: {
            installation: existing,
            availableRepositories: availableRepos,
            alreadyConnected: true,
            message: 'GitHub installation is already connected to your organization.',
          },
        });
      } else {
        return res.status(409).json({
          error: {
            code: 'ALREADY_CLAIMED',
            message: 'This GitHub installation is already linked to another ReviewFlow organization.',
          },
        });
      }
    }

    // Cryptographic state verification
    if (state) {
      const stateRecord = await prisma.installationState.findUnique({
        where: { state: String(state) },
      });

      if (!stateRecord) {
        res.status(400).json({
          error: {
            code: 'INVALID_STATE',
            message: 'Invalid installation state token. Please restart connection from ReviewFlow AI.',
          },
        });
        return;
      }

      if (stateRecord.organizationId !== orgId) {
        logger.warn('Tenant mismatch during installation claim', {
          stateOrgId: stateRecord.organizationId,
          activeOrgId: orgId,
        });
        res.status(403).json({
          error: {
            code: 'TENANT_MISMATCH',
            message: 'Installation state does not match your active organization.',
          },
        });
        return;
      }

      if (new Date() > stateRecord.expiresAt) {
        res.status(400).json({
          error: {
            code: 'STATE_EXPIRED',
            message: 'Installation state has expired. Please initiate connection again.',
          },
        });
        return;
      }

      // Check for idempotent retry if state was already used
      if (stateRecord.usedAt) {
        const existingInst = await prisma.gitHubInstallation.findUnique({
          where: { installationId: targetInstallationId },
        });

        if (existingInst && existingInst.organizationId === orgId) {
          // Idempotent callback retry: fetch repos and return existing installation
          try {
            const availableRepos = await client.listInstallationRepositories(targetInstallationId);
            return res.status(200).json({
              data: {
                installation: existingInst,
                availableRepositories: availableRepos,
                idempotent: true,
              },
            });
          } catch {
            return res.status(200).json({
              data: {
                installation: existingInst,
                availableRepositories: [],
                idempotent: true,
              },
            });
          }
        }

        res.status(400).json({
          error: {
            code: 'STATE_ALREADY_USED',
            message: 'This installation authorization has already been claimed.',
          },
        });
        return;
      }

      // Mark single-use state as consumed
      await prisma.installationState.update({
        where: { id: stateRecord.id },
        data: { usedAt: new Date() },
      });
    } else if (process.env.NODE_ENV === 'production') {
      res.status(400).json({
        error: {
          code: 'MISSING_STATE',
          message: 'Cryptographically secure state token is required for installation claim in production.',
        },
      });
      return;
    }

    try {
      // 1. Verify existence of installation with GitHub API & verify app_id ownership
      const details = await client.getInstallationDetails(targetInstallationId);
      const accountLogin = (details.account as any)?.login || 'unknown';
      const accountType = (details.account as any)?.type || 'Organization';
      const avatarUrl = (details.account as any)?.avatar_url || null;

      // 2. Prevent cross-tenant claim hijacking
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
    let currentId = inst.installationId;
    let repos: any[] = [];

    try {
      repos = await client.listInstallationRepositories(currentId);
    } catch (err: any) {
      logger.warn('Failed to fetch repositories for installation, attempting auto-sync', {
        installationId: currentId,
        error: err.message,
      });

      const freshId = await resolveActiveInstallation(orgId, inst.accountLogin, currentId);
      if (freshId && freshId !== currentId) {
        currentId = freshId;
        try {
          repos = await client.listInstallationRepositories(currentId);
        } catch (retryErr: any) {
          logger.warn('Retry after installation sync failed', {
            installationId: currentId,
            error: retryErr.message,
          });
        }
      }
    }

    for (const r of repos) {
      const existing = connectedRepoMap.get(BigInt(r.id));
      allAvailable.push({
        id: r.id,
        name: r.name,
        fullName: r.fullName,
        private: r.private,
        defaultBranch: r.defaultBranch,
        installationId: currentId,
        accountLogin: inst.accountLogin,
        isConnected: Boolean(existing && existing.isActive && existing.autoReviewEnabled),
        existingRepositoryId: existing?.id || null,
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

  const targetInstallation =
    repo.organization.installations.find(
      (i) => i.accountLogin.toLowerCase() === repo.owner.toLowerCase()
    ) || repo.organization.installations[0];

  const client = getGitHubAppClient(targetInstallation?.installationId);
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
    let ghPullRequests: any[] = [];
    try {
      ghPullRequests = await adapter.listPullRequests(repo.owner, repo.name, state, page, limit);
  } catch (err: any) {
    if ((err.status === 404 || err.message?.includes('Not Found')) && client) {
      logger.warn('404 fetching PRs, attempting to auto-sync active GitHub installation', {
        repo: repo.fullName,
        owner: repo.owner,
      });
      const freshInstallationId = await resolveActiveInstallation(
        orgId,
        repo.owner,
        targetInstallation?.installationId
      );
      if (freshInstallationId && freshInstallationId !== targetInstallation?.installationId) {
        const freshClient = getGitHubAppClient(freshInstallationId);
        if (freshClient) {
          try {
            ghPullRequests = await freshClient.listPullRequests(repo.owner, repo.name, state, page, limit);
          } catch (retryErr: any) {
            logger.error('Failed to list GitHub pull requests after sync', { error: retryErr.message });
            throw retryErr;
          }
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

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
        author: (ghPr.author && ghPr.author !== 'unknown') ? ghPr.author : (dbPr?.author || 'unknown'),
        authorAvatarUrl: ghPr.authorAvatarUrl || dbPr?.authorAvatarUrl || null,
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

    const targetInstallation =
      repo.organization.installations.find(
        (i) => i.accountLogin.toLowerCase() === repo.owner.toLowerCase()
      ) || repo.organization.installations[0];

    const client = getGitHubAppClient(targetInstallation?.installationId);
    const adapter: IGitHubAdapter | null = client || (process.env.GITHUB_MOCK_MODE === 'true' ? new MockGitHubAdapter() : null);

    if (!adapter) {
      res.status(500).json({
        error: { code: 'GITHUB_NOT_CONFIGURED', message: 'GitHub credentials are not configured on the server.' },
      });
      return;
    }

    let prDetails: any;
    try {
      try {
        prDetails = await adapter.fetchPullRequest(repo.owner, repo.name, prNumber);
      } catch (err: any) {
        if ((err.status === 404 || err.message?.includes('Not Found')) && client) {
          logger.warn('404 fetching PR details for review, attempting to auto-sync installation', {
            repo: repo.fullName,
            prNumber,
          });
          const freshId = await resolveActiveInstallation(orgId, repo.owner, targetInstallation?.installationId);
          if (freshId && freshId !== targetInstallation?.installationId) {
            const freshClient = getGitHubAppClient(freshId);
            if (freshClient) {
              prDetails = await freshClient.fetchPullRequest(repo.owner, repo.name, prNumber);
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

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
          author: prDetails.user?.login || undefined,
          authorAvatarUrl: prDetails.user?.avatarUrl || undefined,
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

        if (['FAILED', 'CANCELLED', 'SUPERSEDED'].includes(existingJob.status)) {
          // Re-queue the existing failed job directly without duplicate key or extra billing
          const updatedJob = await prisma.reviewJob.update({
            where: { id: existingJob.id },
            data: {
              status: 'QUEUED',
              progressPercent: 0,
              statusMessage: 'Review job re-queued on demand by user.',
              errorMessage: null,
              startedAt: null,
              completedAt: null,
            },
          });

          await enqueueReviewJob(updatedJob.id);

          logger.info('Re-queued previous failed review job on demand', {
            repo: repo.fullName,
            prNumber: pr.number,
            commitSha: prDetails.head.sha,
            jobId: updatedJob.id,
          });

          res.status(202).json({
            data: {
              message: 'Review job successfully re-queued for execution.',
              reviewJobId: updatedJob.id,
              pullRequestId: pr.id,
              prNumber: pr.number,
              commitSha: prDetails.head.sha,
              status: updatedJob.status,
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

      // 5. Atomic Monthly Quota Enforcement
      const quotaCheck = await checkAndIncrementReviewQuota(repo.organizationId, { isBillable: true });
      if (!quotaCheck.allowed) {
        res.status(402).json({
          error: {
            code: 'PLAN_QUOTA_EXCEEDED',
            message: quotaCheck.message,
            currentUsage: quotaCheck.currentUsage,
            limit: quotaCheck.limit,
            resetDate: quotaCheck.resetDate.toISOString().split('T')[0],
            upgradeUrl: '/dashboard/settings',
          },
        });
        return;
      }

      // 6. Create new ReviewJob (guarantee unique idempotencyKey even if an existing row has baseKey)
      const baseKey = `review-${pr.id}-${prDetails.head.sha}`;
      const existingWithKey = await prisma.reviewJob.findUnique({
        where: { idempotencyKey: baseKey },
      });
      const idempotencyKey = (forceRerun || existingWithKey)
        ? `${baseKey}-rerun-${Date.now()}`
        : baseKey;

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

function getApiLlmProvider(): ILlmProvider {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  if (geminiKey && geminiKey.trim() !== '') {
    return new GeminiProvider(geminiKey, process.env.AI_MODEL_GEMINI || 'gemini-3.5-flash');
  }
  if (openAiKey && openAiKey.trim() !== '') {
    return new OpenAiProvider(openAiKey, process.env.AI_MODEL_OPENAI || 'gpt-4o');
  }
  return new MockLlmProvider();
}

function getApiEmbeddingProvider(): IEmbeddingProvider {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  if (geminiKey && geminiKey.trim() !== '') {
    return new GeminiEmbeddingProvider(geminiKey);
  }
  if (openAiKey && openAiKey.trim() !== '') {
    return new OpenAiEmbeddingProvider(openAiKey);
  }
  return new MockEmbeddingProvider();
}

/**
 * POST /api/v1/repositories/:id/index
 * Trigger repository codebase indexing
 */
repositoriesRouter.post(
  '/:id/index',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { commitSha, branch } = req.body || {};

    const repo = await prisma.repository.findFirst({
      where: {
        id,
        organizationId: req.organizationId!,
      },
    });

    if (!repo) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Repository not found in your organization.' },
      });
    }

    // Check if an indexing job is already running
    const existingRunning = await prisma.repositoryIndexJob.findFirst({
      where: {
        repositoryId: repo.id,
        status: { in: ['QUEUED', 'CLONING', 'CHUNKING', 'EMBEDDING'] },
      },
    });

    if (existingRunning) {
      return res.status(409).json({
        error: {
          code: 'INDEXING_ALREADY_IN_PROGRESS',
          message: 'An indexing job is already active for this repository.',
          jobId: existingRunning.id,
        },
      });
    }

    const indexJob = await prisma.repositoryIndexJob.create({
      data: {
        repositoryId: repo.id,
        commitSha: commitSha || repo.lastIndexedCommitSha || 'HEAD',
        branch: branch || repo.defaultBranch || 'main',
        status: 'QUEUED',
        statusMessage: 'Indexing job created and enqueued.',
      },
    });

    await enqueueIndexJob(indexJob.id);

    res.status(202).json({
      data: {
        message: 'Repository indexing job queued successfully.',
        indexJob,
      },
    });
  }
);

/**
 * GET /api/v1/repositories/:id/index/status
 * Get the latest indexing status and chunk metrics for a repository
 */
repositoriesRouter.get(
  '/:id/index/status',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const repo = await prisma.repository.findFirst({
      where: {
        id,
        organizationId: req.organizationId!,
      },
    });

    if (!repo) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Repository not found in your organization.' },
      });
    }

    const [latestJob, indexedFilesCount, totalChunksCount] = await Promise.all([
      prisma.repositoryIndexJob.findFirst({
        where: { repositoryId: repo.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.indexedFile.count({ where: { repositoryId: repo.id } }),
      prisma.codeChunk.count({ where: { repositoryId: repo.id } }),
    ]);

    res.json({
      data: {
        repositoryId: repo.id,
        fullName: repo.fullName,
        lastIndexedAt: repo.lastIndexedAt,
        lastIndexedCommitSha: repo.lastIndexedCommitSha,
        indexedFilesCount,
        totalChunksCount,
        latestJob,
      },
    });
  }
);

/**
 * POST /api/v1/repositories/:id/qna
 * Codebase Q&A: ask a question grounded in repository source evidence
 */
repositoriesRouter.post(
  '/:id/qna',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { question, conversationId } = req.body || {};

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Field "question" is required.' },
      });
    }

    const repo = await prisma.repository.findFirst({
      where: {
        id,
        organizationId: req.organizationId!,
      },
    });

    if (!repo) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Repository not found in your organization.' },
      });
    }

    // Authoritative monthly Codebase Q&A quota enforcement
    const quota = await checkAndIncrementQnAQuota(repo.organizationId);
    if (!quota.allowed) {
      return res.status(403).json({
        error: {
          code: 'QUOTA_EXCEEDED',
          message: quota.message || 'Monthly Codebase Q&A quota reached. Upgrade your plan to ask more questions.',
          quota,
        },
      });
    }

    // Resolve or create conversation
    let conversation = conversationId
      ? await prisma.codebaseConversation.findFirst({
          where: { id: conversationId, repositoryId: repo.id, userId: req.user!.id },
          include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } },
        })
      : null;

    if (!conversation) {
      conversation = await prisma.codebaseConversation.create({
        data: {
          repositoryId: repo.id,
          userId: req.user!.id,
          title: question.slice(0, 80),
        },
        include: { messages: true },
      });
    }

    // Record user message
    await prisma.codebaseMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: question.trim(),
      },
    });

    const llmProvider = getApiLlmProvider();
    const embeddingProvider = getApiEmbeddingProvider();

    // Run Q&A engine
    const history = (conversation.messages || []).map((m) => ({
      role: m.role as 'USER' | 'ASSISTANT',
      content: m.content,
    }));

    const result = await askCodebaseQuestion({
      repositoryId: repo.id,
      repoFullName: repo.fullName,
      question: question.trim(),
      history,
      llmProvider,
      embeddingProvider,
    });

    // Record assistant response with citations and telemetry
    const assistantMessage = await prisma.codebaseMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: result.answer,
        citationsJson: JSON.stringify({
          citations: result.citations,
          telemetry: result.telemetry,
        }),
        tokensUsed: result.tokensUsed,
      },
    });

    // Meter tokens and cost to organization monthly usage
    const now = new Date();
    const periodYear = now.getFullYear();
    const periodMonth = now.getMonth() + 1;
    await prisma.usageRecord.upsert({
      where: {
        organizationId_periodYear_periodMonth: {
          organizationId: repo.organizationId,
          periodYear,
          periodMonth,
        },
      },
      create: {
        organizationId: repo.organizationId,
        periodYear,
        periodMonth,
        reviewCount: 0,
        tokenCount: result.tokensUsed,
        estimatedCostUsd: result.telemetry.cost.estimatedCostUsd,
      },
      update: {
        tokenCount: { increment: result.tokensUsed },
        estimatedCostUsd: { increment: result.telemetry.cost.estimatedCostUsd },
      },
    }).catch((err: any) => {
      logger.warn('Failed to update UsageRecord for Q&A query', { error: err.message });
    });

    res.json({
      data: {
        conversationId: conversation.id,
        messageId: assistantMessage.id,
        answer: result.answer,
        citations: result.citations,
        tokensUsed: result.tokensUsed,
        retrievedChunksCount: result.retrievedChunksCount,
        telemetry: result.telemetry,
      },
    });
  }
);

/**
 * GET /api/v1/repositories/:id/qna/conversations
 * List conversations for a repository
 */
repositoriesRouter.get(
  '/:id/qna/conversations',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const conversations = await prisma.codebaseConversation.findMany({
      where: {
        repositoryId: id,
        userId: req.user!.id,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
      take: 20,
    });

    res.json({ data: conversations });
  }
);

/**
 * GET /api/v1/repositories/:id/qna/conversations/:convoId
 * Get messages in a conversation
 */
repositoriesRouter.get(
  '/:id/qna/conversations/:convoId',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id, convoId } = req.params;

    const conversation = await prisma.codebaseConversation.findFirst({
      where: {
        id: convoId,
        repositoryId: id,
        userId: req.user!.id,
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Conversation not found.' },
      });
    }

    const formattedMessages = conversation.messages.map((m) => {
      let citations: any[] = [];
      let telemetry: any = undefined;
      if (m.citationsJson) {
        try {
          const parsed = JSON.parse(m.citationsJson);
          if (Array.isArray(parsed)) {
            citations = parsed;
          } else if (parsed && typeof parsed === 'object') {
            citations = parsed.citations || [];
            telemetry = parsed.telemetry || undefined;
          }
        } catch {}
      }
      return {
        id: m.id,
        role: m.role,
        content: m.content,
        citations,
        telemetry,
        tokensUsed: m.tokensUsed,
        createdAt: m.createdAt,
      };
    });

    res.json({
      data: {
        ...conversation,
        messages: formattedMessages,
      },
    });
  }
);

/**
 * POST /api/v1/repositories/:id/suggestions/test
 * Generate unit/integration test proposal for a file
 */
repositoriesRouter.post(
  '/:id/suggestions/test',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { targetFile, diffSnippet, testFramework } = req.body || {};

    if (!targetFile) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Field "targetFile" is required.' },
      });
    }

    const repo = await prisma.repository.findFirst({
      where: { id, organizationId: req.organizationId! },
    });

    if (!repo) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Repository not found.' },
      });
    }

    // Retrieve file content from DB or GitHub
    let fileContent = '';
    const indexed = await prisma.indexedFile.findUnique({
      where: { repositoryId_filePath: { repositoryId: repo.id, filePath: targetFile } },
      include: { chunks: true },
    });

    if (indexed && indexed.chunks.length > 0) {
      fileContent = indexed.chunks.map((c) => c.content).join('\n');
    } else {
      const activeInstallationId = await resolveActiveInstallation(repo.organizationId, repo.owner);
      const github = getGitHubAppClient(activeInstallationId || undefined) || new MockGitHubAdapter();
      try {
        const remote = await github.fetchFileContent(repo.owner, repo.name, targetFile, repo.defaultBranch);
        fileContent = remote.content;
      } catch {
        fileContent = `// File content placeholder for ${targetFile}`;
      }
    }

    const llmProvider = getApiLlmProvider();
    const proposal = await generateTestSuggestion({
      targetFile,
      fileContent,
      diffSnippet,
      testFramework,
      llmProvider,
    });

    // Save test suggestion record
    const saved = await prisma.testSuggestion.create({
      data: {
        repositoryId: repo.id,
        behaviorTested: proposal.behaviorTested,
        rationale: proposal.rationale,
        targetFile: proposal.targetFile,
        testFramework: proposal.testFramework,
        proposedCode: proposal.proposedCode,
        edgeCases: JSON.stringify(proposal.edgeCases),
        existingCoverageNotes: proposal.existingCoverageNotes || null,
        status: 'PROPOSED',
      },
    });

    res.json({ data: saved });
  }
);

/**
 * GET /api/v1/repositories/:id/suggestions/tests
 * List test suggestions for a repository
 */
repositoriesRouter.get(
  '/:id/suggestions/tests',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const suggestions = await prisma.testSuggestion.findMany({
      where: { repositoryId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ data: suggestions });
  }
);

/**
 * POST /api/v1/repositories/:id/approvals/request
 * Create a human approval request before any write action
 */
repositoriesRouter.post(
  '/:id/approvals/request',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { actionType, targetBranch, targetCommitSha, title, description, payload } = req.body || {};

    if (!actionType || !targetBranch || !payload) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Fields actionType, targetBranch, and payload are required.' },
      });
    }

    const repo = await prisma.repository.findFirst({
      where: { id, organizationId: req.organizationId! },
    });

    if (!repo) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Repository not found.' } });
    }

    // Cryptographic one-time nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const approval = await prisma.approvalRequest.create({
      data: {
        organizationId: req.organizationId!,
        repositoryId: repo.id,
        userId: req.user!.id,
        actionType,
        targetBranch,
        targetCommitSha: targetCommitSha || 'HEAD',
        title: title || `Proposed write action: ${actionType}`,
        description: description || 'Human-in-the-loop developer authorization required.',
        payloadJson: typeof payload === 'string' ? payload : JSON.stringify(payload),
        nonce,
        status: 'PENDING',
        expiresAt,
      },
    });

    res.status(201).json({
      data: {
        approvalId: approval.id,
        nonce,
        status: approval.status,
        expiresAt: approval.expiresAt,
        message: 'Approval request created. Authorized developer confirmation required before write execution.',
      },
    });
  }
);

/**
 * POST /api/v1/repositories/:id/approvals/:approvalId/execute
 * Authorized developer approves and executes write action
 */
repositoriesRouter.post(
  '/:id/approvals/:approvalId/execute',
  requireRole(['OWNER', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id, approvalId } = req.params;
    const { nonce, approve, rejectionReason } = req.body || {};

    const approval = await prisma.approvalRequest.findFirst({
      where: {
        id: approvalId,
        repositoryId: id,
        organizationId: req.organizationId!,
      },
      include: { repository: true },
    });

    if (!approval) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Approval request not found.' } });
    }

    if (approval.status !== 'PENDING') {
      return res.status(409).json({
        error: { code: 'ALREADY_RESOLVED', message: `Request is already ${approval.status}. Replay blocked.` },
      });
    }

    if (new Date() > approval.expiresAt) {
      await prisma.approvalRequest.update({
        where: { id: approval.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(410).json({ error: { code: 'EXPIRED', message: 'Approval request has expired.' } });
    }

    // Validate cryptographic nonce
    if (!nonce || nonce !== approval.nonce) {
      return res.status(403).json({ error: { code: 'INVALID_NONCE', message: 'Security nonce mismatch or missing.' } });
    }

    // Rejection branch
    if (approve === false) {
      const updated = await prisma.approvalRequest.update({
        where: { id: approval.id },
        data: {
          status: 'REJECTED',
          approvedByUserId: req.user!.id,
          rejectionReason: rejectionReason || 'Rejected by developer.',
        },
      });

      await prisma.auditLog.create({
        data: {
          organizationId: req.organizationId!,
          userId: req.user!.id,
          action: 'REJECT_WRITE_APPROVAL',
          resourceType: 'ApprovalRequest',
          resourceId: approval.id,
          detailsJson: JSON.stringify({ actionType: approval.actionType, reason: rejectionReason }),
        },
      });

      return res.json({ data: { status: 'REJECTED', approval: updated } });
    }

    // Approved branch -> Execute write via GitHub App
    const activeInstallationId = await resolveActiveInstallation(
      approval.repository.organizationId,
      approval.repository.owner
    );
    const github = getGitHubAppClient(activeInstallationId || undefined) || new MockGitHubAdapter();

    try {
      let executionResult: any;

      if (approval.actionType === 'CREATE_BRANCH' && github.createBranch) {
        executionResult = await github.createBranch(
          approval.repository.owner,
          approval.repository.name,
          approval.targetBranch,
          approval.targetCommitSha
        );
      } else if ((approval.actionType === 'COMMIT_FILE' || approval.actionType === 'APPLY_PATCH') && github.commitFileChanges) {
        const payload = JSON.parse(approval.payloadJson);
        const files = Array.isArray(payload.files) ? payload.files : [{ path: payload.path, content: payload.content }];
        executionResult = await github.commitFileChanges(
          approval.repository.owner,
          approval.repository.name,
          approval.targetBranch,
          approval.title,
          files
        );
      } else if (approval.actionType === 'CREATE_PR' && github.createPullRequest) {
        const payload = JSON.parse(approval.payloadJson);
        executionResult = await github.createPullRequest(
          approval.repository.owner,
          approval.repository.name,
          approval.title,
          approval.description,
          payload.headBranch || approval.targetBranch,
          payload.baseBranch || approval.repository.defaultBranch
        );
      } else {
        throw new Error(`Unsupported actionType: ${approval.actionType}`);
      }

      const updated = await prisma.approvalRequest.update({
        where: { id: approval.id },
        data: {
          status: 'EXECUTED',
          approvedByUserId: req.user!.id,
          executedAt: new Date(),
          executionResult: JSON.stringify(executionResult),
        },
      });

      await prisma.auditLog.create({
        data: {
          organizationId: req.organizationId!,
          userId: req.user!.id,
          action: 'EXECUTE_WRITE_APPROVAL',
          resourceType: 'ApprovalRequest',
          resourceId: approval.id,
          detailsJson: JSON.stringify({ actionType: approval.actionType, executionResult }),
        },
      });

      res.json({
        data: {
          status: 'EXECUTED',
          approval: updated,
          executionResult,
          message: 'Write action successfully executed with authorized confirmation.',
        },
      });
    } catch (err: any) {
      res.status(502).json({
        error: { code: 'WRITE_EXECUTION_FAILED', message: `Execution failed on GitHub: ${err.message}` },
      });
    }
  }
);

/**
 * POST /api/v1/repositories/:id/tools/execute
 * Controlled read-only tool calling execution
 */
repositoriesRouter.post(
  '/:id/tools/execute',
  requireRole(['OWNER', 'ADMIN', 'MEMBER']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { toolName, args } = req.body || {};

    const tool = CODE_ASSISTANT_TOOLS[toolName];
    if (!tool) {
      return res.status(404).json({
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool "${toolName}" not recognized. Permitted tools: ${Object.keys(CODE_ASSISTANT_TOOLS).join(', ')}`,
        },
      });
    }

    const repo = await prisma.repository.findFirst({
      where: { id, organizationId: req.organizationId! },
    });

    if (!repo) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Repository not found in your organization.' } });
    }

    const activeInstallationId = await resolveActiveInstallation(repo.organizationId, repo.owner);
    const github = getGitHubAppClient(activeInstallationId || undefined) || new MockGitHubAdapter();
    const embeddingProvider = getApiEmbeddingProvider();

    try {
      const result = await tool.execute(args || {}, {
        organizationId: req.organizationId!,
        repositoryId: repo.id,
        githubAdapter: github,
        embeddingProvider,
      });

      res.json({ data: { toolName, result } });
    } catch (err: any) {
      res.status(400).json({
        error: { code: 'TOOL_EXECUTION_ERROR', message: err.message },
      });
    }
  }
);

