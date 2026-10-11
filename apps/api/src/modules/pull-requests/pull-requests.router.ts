import { Router, Response } from 'express';
import { prisma } from '@reviewflow/database';
import { authenticateToken, AuthenticatedRequest } from '../../common/auth.middleware';

export const pullRequestsRouter = Router();
pullRequestsRouter.use(authenticateToken);

// GET /api/v1/pull-requests
pullRequestsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const { state, repositoryId, search, page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const take = Math.min(parseInt(limit as string, 10), 100);
  const skip = (pageNum - 1) * take;

  const whereClause: Record<string, unknown> = {
    repository: { organizationId: orgId }, // Multi-tenant isolation
  };

  if (state && typeof state === 'string') {
    whereClause.state = state.toUpperCase();
  }

  if (repositoryId && typeof repositoryId === 'string') {
    whereClause.repositoryId = repositoryId;
  }

  if (search && typeof search === 'string') {
    whereClause.OR = [
      { title: { contains: search } },
      { author: { contains: search } },
    ];
  }

  const [totalCount, pullRequests] = await Promise.all([
    prisma.pullRequest.count({ where: whereClause }),
    prisma.pullRequest.findMany({
      where: whereClause,
      include: {
        repository: { select: { fullName: true, name: true } },
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
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    }),
  ]);

  const items = pullRequests.map((pr) => {
    const latestJob = pr.reviewJobs[0];
    const findings = latestJob?.result?.findings || [];

    const findingCounts = {
      CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
      HIGH: findings.filter((f) => f.severity === 'HIGH').length,
      MEDIUM: findings.filter((f) => f.severity === 'MEDIUM').length,
      LOW: findings.filter((f) => f.severity === 'LOW').length,
      INFO: findings.filter((f) => f.severity === 'INFO').length,
    };

    return {
      id: pr.id,
      repositoryId: pr.repositoryId,
      repoFullName: pr.repository.fullName,
      repoName: pr.repository.name,
      number: pr.number,
      title: pr.title,
      author: pr.author,
      authorAvatarUrl: pr.authorAvatarUrl,
      baseBranch: pr.baseBranch,
      headBranch: pr.headBranch,
      headSha: pr.headSha,
      state: pr.state,
      latestReview: latestJob
        ? {
            id: latestJob.id,
            status: latestJob.status,
            overallRisk: latestJob.result?.overallRisk || 'SAFE',
            findingCounts,
            totalFindings: findings.length,
            durationSeconds: latestJob.durationSeconds,
            createdAt: latestJob.createdAt,
          }
        : null,
      updatedAt: pr.updatedAt,
      createdAt: pr.createdAt,
    };
  });

  res.json({
    data: items,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(totalCount / take),
    },
  });
});

// GET /api/v1/pull-requests/:id
pullRequestsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const pr = await prisma.pullRequest.findFirst({
    where: {
      id: req.params.id,
      repository: { organizationId: req.user!.organizationId },
    },
    include: {
      repository: true,
      reviewJobs: {
        orderBy: { createdAt: 'desc' },
        include: {
          result: {
            include: {
              findings: true,
            },
          },
        },
      },
    },
  });

  if (!pr) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Pull request not found.' } });
    return;
  }

  res.json({ data: pr });
});
