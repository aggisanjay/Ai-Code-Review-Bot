import { Router, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '@reviewflow/database';
import { PLAN_CONFIGS, PlanTier } from '@reviewflow/shared';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../../common/auth.middleware';
import { getCalendarMonthPeriod } from './quota.service';
import { logger } from '../../common/logger';

export const billingRouter = Router();
billingRouter.use(authenticateToken);

function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, {
    apiVersion: '2024-09-30.acacia' as any,
  });
}

// GET /api/v1/billing/subscription
billingRouter.get('/subscription', async (req: AuthenticatedRequest, res: Response) => {
  const { periodYear, periodMonth, resetDate } = getCalendarMonthPeriod();

  const org = await prisma.organization.findUnique({
    where: { id: req.user!.organizationId },
    include: {
      subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
      usageRecords: {
        where: {
          periodYear,
          periodMonth,
        },
      },
      _count: {
        select: { repositories: true, members: true },
      },
    },
  });

  if (!org) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Organization not found.' } });
    return;
  }

  const currentPlan = ((org.plan || 'FREE').toUpperCase() as PlanTier) in PLAN_CONFIGS
    ? ((org.plan || 'FREE').toUpperCase() as PlanTier)
    : 'FREE';

  const planLimits = PLAN_CONFIGS[currentPlan] || PLAN_CONFIGS.FREE;
  const usage = org.usageRecords[0] || { reviewCount: 0, tokenCount: 0, estimatedCostUsd: 0 };
  const subscription = org.subscriptions[0] || null;

  const startOfMonth = new Date(Date.UTC(periodYear, periodMonth - 1, 1, 0, 0, 0));
  const qnaCount = await prisma.codebaseMessage.count({
    where: {
      conversation: { repository: { organizationId: org.id } },
      role: 'ASSISTANT',
      createdAt: { gte: startOfMonth, lt: resetDate },
    },
  });

  res.json({
    data: {
      plan: currentPlan,
      limits: planLimits,
      reviewsUsed: usage.reviewCount,
      reviewsLimit: planLimits.maxReviewsPerMonth,
      reviewsRemaining: Math.max(0, planLimits.maxReviewsPerMonth - usage.reviewCount),
      qnaUsed: qnaCount,
      qnaLimit: planLimits.maxQnaQueriesPerMonth,
      qnaRemaining: Math.max(0, planLimits.maxQnaQueriesPerMonth - qnaCount),
      tokenCount: usage.tokenCount,
      estimatedCostUsd: parseFloat(usage.estimatedCostUsd.toFixed(4)),
      reposUsed: org._count.repositories,
      reposLimit: planLimits.maxRepositories,
      resetDate: resetDate.toISOString().split('T')[0],
      usage: {
        reviewsUsed: usage.reviewCount,
        reviewsLimit: planLimits.maxReviewsPerMonth,
        reviewsRemaining: Math.max(0, planLimits.maxReviewsPerMonth - usage.reviewCount),
        reviewsPercentage: Math.min(100, Math.round((usage.reviewCount / planLimits.maxReviewsPerMonth) * 100)),
        qnaUsed: qnaCount,
        qnaLimit: planLimits.maxQnaQueriesPerMonth,
        qnaRemaining: Math.max(0, planLimits.maxQnaQueriesPerMonth - qnaCount),
        qnaPercentage: Math.min(100, Math.round((qnaCount / planLimits.maxQnaQueriesPerMonth) * 100)),
        tokenCount: usage.tokenCount,
        estimatedCostUsd: parseFloat(usage.estimatedCostUsd.toFixed(4)),
        resetDate: resetDate.toISOString().split('T')[0],
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
      stripeCustomerId: org.stripeCustomerId || null,
      hasPaymentMethod: Boolean(org.stripeCustomerId),
      availablePlans: PLAN_CONFIGS,
    },
  });
});

// POST /api/v1/billing/checkout
billingRouter.post('/checkout', requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const { planTier } = req.body;

  if (!['PRO', 'TEAM'].includes(planTier)) {
    res.status(400).json({ error: { code: 'INVALID_PLAN', message: 'Valid upgrade plans: PRO, TEAM' } });
    return;
  }

  const orgId = req.user!.organizationId;
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Organization not found.' } });
    return;
  }

  const stripe = getStripeClient();
  const secretKey = process.env.STRIPE_SECRET_KEY;

  // Real Stripe Integration Path
  if (stripe && secretKey && !secretKey.includes('mock')) {
    const priceId =
      planTier === 'PRO' ? process.env.STRIPE_PRICE_ID_PRO : process.env.STRIPE_PRICE_ID_TEAM;

    if (!priceId) {
      res.status(400).json({
        error: {
          code: 'STRIPE_PRICE_NOT_CONFIGURED',
          message: `Missing Stripe Price ID for ${planTier} tier in environment variables (STRIPE_PRICE_ID_${planTier}).`,
        },
      });
      return;
    }

    const origin = req.headers.origin || 'http://localhost:3000';

    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        client_reference_id: org.id,
        metadata: {
          organizationId: org.id,
          planTier,
        },
        subscription_data: {
          metadata: {
            organizationId: org.id,
            planTier,
          },
        },
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${origin}/dashboard/settings?billing_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/settings?billing_cancelled=true`,
      };

      // Associate with existing Stripe customer if available
      if (org.stripeCustomerId) {
        sessionParams.customer = org.stripeCustomerId;
      } else {
        sessionParams.customer_email = req.user!.email;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      logger.info('Created Stripe Checkout Session', {
        orgId: org.id,
        planTier,
        sessionId: session.id,
      });

      res.json({
        data: {
          checkoutUrl: session.url,
          sessionId: session.id,
        },
      });
      return;
    } catch (err: any) {
      logger.error('Stripe checkout session error', { error: err.message, orgId: org.id, planTier });
      res.status(500).json({
        error: {
          code: 'STRIPE_ERROR',
          message: `Stripe checkout session failed: ${err.message}`,
        },
      });
      return;
    }
  }

  // If Stripe is not configured: Fail visibly with setup blocker (no fake fallback)
  res.status(400).json({
    error: {
      code: 'STRIPE_NOT_CONFIGURED',
      message:
        'Stripe billing is not configured. Please configure STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PRO / STRIPE_PRICE_ID_TEAM on the server.',
    },
  });
});

// POST /api/v1/billing/portal
billingRouter.post('/portal', requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const org = await prisma.organization.findUnique({ where: { id: orgId } });

  if (!org) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Organization not found.' } });
    return;
  }

  if (!org.stripeCustomerId) {
    res.status(400).json({
      error: {
        code: 'NO_STRIPE_CUSTOMER',
        message: 'No active Stripe billing customer found for this organization. Upgrade to a paid plan first.',
      },
    });
    return;
  }

  const stripe = getStripeClient();
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripe || !secretKey || secretKey.includes('mock')) {
    res.status(400).json({
      error: {
        code: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripe customer portal is not configured on the server.',
      },
    });
    return;
  }

  const origin = req.headers.origin || 'http://localhost:3000';

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${origin}/dashboard/settings`,
    });

    res.json({
      data: {
        portalUrl: portalSession.url,
      },
    });
  } catch (err: any) {
    logger.error('Stripe customer portal error', { error: err.message, orgId });
    res.status(500).json({
      error: {
        code: 'STRIPE_PORTAL_ERROR',
        message: `Failed to create Stripe portal session: ${err.message}`,
      },
    });
  }
});
