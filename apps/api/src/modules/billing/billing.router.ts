import { Router, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '@reviewflow/database';
import { PLAN_CONFIGS, PlanTier } from '@reviewflow/shared';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../../common/auth.middleware';
import { config } from '../../common/config';

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
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Organization not found.' } });
    return;
  }

  const currentPlan = (org.plan as PlanTier) || 'FREE';
  const planLimits = PLAN_CONFIGS[currentPlan] || PLAN_CONFIGS.FREE;
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
          message: `Missing Stripe Price ID for ${planTier} tier in environment variables.`,
        },
      });
      return;
    }

    const origin = req.headers.origin || 'http://localhost:3000';

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        client_reference_id: org.id,
        customer_email: req.user!.email,
        metadata: {
          organizationId: org.id,
          planTier,
        },
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${origin}/dashboard/settings?billing_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/settings?billing_cancelled=true`,
      });

      res.json({
        data: {
          checkoutUrl: session.url,
          sessionId: session.id,
        },
      });
      return;
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'STRIPE_ERROR',
          message: `Stripe checkout session failed: ${err.message}`,
        },
      });
      return;
    }
  }

  // If Stripe is not configured: Fail visibly with setup blocker
  res.status(400).json({
    error: {
      code: 'STRIPE_NOT_CONFIGURED',
      message:
        'Stripe billing is not configured. Please provide a valid STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PRO / TEAM in your environment.',
    },
  });
});
