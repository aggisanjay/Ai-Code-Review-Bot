import { Router, Response } from 'express';
import { prisma } from '@reviewflow/database';
import { FindingFeedbackSchema } from '@reviewflow/shared';
import { authenticateToken, AuthenticatedRequest } from '../../common/auth.middleware';

export const reviewsRouter = Router();
reviewsRouter.use(authenticateToken);

// GET /api/v1/reviews/:id
reviewsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const reviewJob = await prisma.reviewJob.findFirst({
    where: {
      id: req.params.id,
      pullRequest: {
        repository: { organizationId: req.user!.organizationId },
      },
    },
    include: {
      pullRequest: {
        include: { repository: true },
      },
      result: {
        include: {
          findings: {
            orderBy: [{ severity: 'asc' }, { startLine: 'asc' }],
          },
        },
      },
    },
  });

  if (!reviewJob) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Review job not found.' } });
    return;
  }

  res.json({ data: reviewJob });
});

// GET /api/v1/reviews/:id/findings
reviewsRouter.get('/:id/findings', async (req: AuthenticatedRequest, res: Response) => {
  const { severity, category } = req.query;

  const reviewJob = await prisma.reviewJob.findFirst({
    where: {
      id: req.params.id,
      pullRequest: { repository: { organizationId: req.user!.organizationId } },
    },
    include: { result: true },
  });

  if (!reviewJob || !reviewJob.result) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Review result not found.' } });
    return;
  }

  const whereClause: Record<string, unknown> = {
    reviewResultId: reviewJob.result.id,
  };

  if (severity && typeof severity === 'string') {
    whereClause.severity = severity.toUpperCase();
  }

  if (category && typeof category === 'string') {
    whereClause.category = category.toUpperCase();
  }

  const findings = await prisma.finding.findMany({
    where: whereClause,
    orderBy: { startLine: 'asc' },
  });

  res.json({ data: findings });
});

// POST /api/v1/reviews/:id/retry
reviewsRouter.post('/:id/retry', async (req: AuthenticatedRequest, res: Response) => {
  const existingJob = await prisma.reviewJob.findFirst({
    where: {
      id: req.params.id,
      pullRequest: { repository: { organizationId: req.user!.organizationId } },
    },
    include: { pullRequest: true },
  });

  if (!existingJob) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Review job not found.' } });
    return;
  }

  // Create a new retry job
  const newJob = await prisma.reviewJob.create({
    data: {
      pullRequestId: existingJob.pullRequestId,
      commitSha: existingJob.commitSha,
      status: 'QUEUED',
      idempotencyKey: `retry-${existingJob.pullRequestId}-${existingJob.commitSha}-${Date.now()}`,
      statusMessage: 'Re-review queued manually by team member.',
    },
  });

  res.status(202).json({
    data: {
      message: 'Re-review successfully enqueued.',
      jobId: newJob.id,
    },
  });
});

// POST /api/v1/reviews/findings/:findingId/dismiss
reviewsRouter.post('/findings/:findingId/dismiss', async (req: AuthenticatedRequest, res: Response) => {
  const { reason = 'Dismissed by reviewer' } = req.body;

  const finding = await prisma.finding.findFirst({
    where: {
      id: req.params.findingId,
      reviewResult: {
        reviewJob: {
          pullRequest: { repository: { organizationId: req.user!.organizationId } },
        },
      },
    },
  });

  if (!finding) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Finding not found or access denied.' } });
    return;
  }

  const updated = await prisma.finding.update({
    where: { id: finding.id },
    data: {
      dismissed: true,
      dismissReason: reason,
    },
  });

  res.json({ data: updated });
});

// POST /api/v1/reviews/findings/:findingId/feedback
reviewsRouter.post('/findings/:findingId/feedback', async (req: AuthenticatedRequest, res: Response) => {
  const result = FindingFeedbackSchema.safeParse({ ...req.body, findingId: req.params.findingId });
  if (!result.success) {
    res.status(400).json({ error: { code: 'VALIDATION_FAILED', details: result.error.flatten() } });
    return;
  }

  const { feedbackType, comment } = result.data;

  const finding = await prisma.finding.findFirst({
    where: {
      id: req.params.findingId,
      reviewResult: {
        reviewJob: {
          pullRequest: { repository: { organizationId: req.user!.organizationId } },
        },
      },
    },
  });

  if (!finding) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Finding not found.' } });
    return;
  }

  const feedback = await prisma.findingFeedback.create({
    data: {
      findingId: finding.id,
      userId: req.user!.id,
      feedbackType,
      comment,
    },
  });

  res.status(201).json({ data: feedback });
});
