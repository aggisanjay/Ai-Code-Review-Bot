import { Router, Response } from 'express';
import { prisma } from '@reviewflow/database';
import { ReviewPolicySchema } from '@reviewflow/shared';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../../common/auth.middleware';

export const repositoriesRouter = Router();
repositoriesRouter.use(authenticateToken);

// GET /api/v1/repositories
repositoriesRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  if (!orgId) {
    res.json({ data: [] });
    return;
  }

  const repositories = await prisma.repository.findMany({
    where: { organizationId: orgId },
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
