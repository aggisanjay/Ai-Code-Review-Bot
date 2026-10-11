import { Router, Response } from 'express';
import { prisma } from '@reviewflow/database';
import { PLAN_CONFIGS, PlanTier } from '@reviewflow/shared';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../../common/auth.middleware';

export const billingRouter = Router();
billingRouter.use(authenticateToken);

// GET /api/v1/billing/subscription
billingRouter.get('/subscription', async (req: AuthenticatedRequest, res: Response) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.user!.organizationId },
    include: {
      subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
      usageRecords: {
        where: {
          periodYear: new Date().getFullYear(),
          periodMonth: new Date().getMonth() + 1,
        },
      },
      _count: {
        select: { repositories: true, members: true },
      },
    },
  });

  if (!org) {
    res.status(404).json({ error: { code: 'NOT_FOUND' } });
    return;
  }

  const currentPlan = (org.plan as PlanTier) || 'FREE';
  const planLimits = PLAN_CONFIGS[currentPlan];
  const usage = org.usageRecords[0] || { reviewCount: 0, tokenCount: 0, estimatedCostUsd: 0 };
  const subscription = org.subscriptions[0] || null;

  res.json({
    data: {
      plan: currentPlan,
      limits: planLimits,
      usage: {
        reviewsUsed: usage.reviewCount,
        reviewsLimit: planLimits.maxReviewsPerMonth,
        reviewsPercentage: Math.min(100, Math.round((usage.reviewCount / planLimits.maxReviewsPerMonth) * 100)),
        repositoriesUsed: org._count.repositories,
        repositoriesLimit: planLimits.maxRepositories,
        membersUsed: org._count.members,
        membersLimit: planLimits.maxMembers,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      availablePlans: PLAN_CONFIGS,
    },
  });
});

// POST /api/v1/billing/checkout
billingRouter.post('/checkout', requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const { planTier } = req.body;

  if (!['PRO', 'TEAM', 'ENTERPRISE'].includes(planTier)) {
    res.status(400).json({ error: { code: 'INVALID_PLAN', message: 'Valid plans: PRO, TEAM, ENTERPRISE' } });
    return;
  }

  const orgId = req.user!.organizationId;

  // In test/mock billing mode, simulate instant plan activation
  await prisma.organization.update({
    where: { id: orgId },
    data: { plan: planTier },
  });

  await prisma.subscription.upsert({
    where: { organizationId: orgId },
    create: {
      organizationId: orgId,
      plan: planTier,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
    update: {
      plan: planTier,
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });

  res.json({
    data: {
      success: true,
      message: `Successfully upgraded organization to ${planTier} plan.`,
      url: `${req.headers.origin || 'http://localhost:3000'}/dashboard/settings?billing_success=true`,
    },
  });
});
