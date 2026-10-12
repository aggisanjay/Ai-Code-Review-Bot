import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '@reviewflow/database';
import { verifyWebhookSignature } from '@reviewflow/github-client';
import { config } from '../../common/config';
import { logger } from '../../common/logger';
import { enqueueReviewJob } from '../../common/queue';
import { checkAndIncrementReviewQuota } from '../billing/quota.service';

export const webhooksRouter = Router();

// Lazy Stripe client initialization
function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, {
    apiVersion: '2024-09-30.acacia' as any,
  });
}

// POST /api/v1/webhooks/github
webhooksRouter.post('/github', async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const deliveryId = (req.headers['x-github-delivery'] as string) || `del_${Date.now()}`;
  const eventType = (req.headers['x-github-event'] as string) || 'ping';

  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody || Buffer.from(JSON.stringify(req.body));

  // 1. Webhook Signature Verification
  const isTestFixture =
    config.nodeEnv === 'test' && (!signature || signature === 'test-fixture-mock-signature');

  if (!isTestFixture) {
    if (!signature) {
      logger.warn('Rejected GitHub webhook with missing signature header', { deliveryId });
      res.status(401).json({ error: { code: 'MISSING_SIGNATURE', message: 'x-hub-signature-256 required.' } });
      return;
    }

    const isValid = verifyWebhookSignature({
      payload: rawBody,
      signatureHeader: signature,
      secret: config.githubWebhookSecret,
    });

    if (!isValid) {
      logger.warn('Rejected GitHub webhook with invalid HMAC signature', { deliveryId, eventType });
      res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'HMAC signature verification failed.' } });
      return;
    }
  }

  // 2. Event Deduplication via WebhookEvent table
  const existingDelivery = await prisma.webhookEvent.findUnique({
    where: { deliveryId },
  });

  if (existingDelivery) {
    logger.info('Duplicate webhook delivery deduplicated', { deliveryId });
    res.status(200).json({ received: true, deduplicated: true, status: existingDelivery.status });
    return;
  }

  // 3. Persist Event in WebhookEvent
  await prisma.webhookEvent.create({
    data: {
      deliveryId,
      eventType,
      repositoryFullName: req.body.repository?.full_name || null,
      status: 'PROCESSED',
      payloadJson: JSON.stringify(req.body),
      processedAt: new Date(),
    },
  });

  // Handle GitHub App Installation events
  if (eventType === 'installation') {
    const { action, installation } = req.body;
    if (action === 'deleted' && installation?.id) {
      await prisma.gitHubInstallation.deleteMany({
        where: { installationId: installation.id },
      });
      logger.info('GitHub installation uninstalled', { installationId: installation.id });
    } else if ((action === 'created' || action === 'new_permissions_accepted' || action === 'unsuspend') && installation?.id) {
      const accountLogin = installation.account?.login || 'unknown';
      const existing = await prisma.gitHubInstallation.findFirst({
        where: { accountLogin },
      });
      if (existing) {
        await prisma.gitHubInstallation.update({
          where: { id: existing.id },
          data: {
            installationId: installation.id,
            avatarUrl: installation.account?.avatar_url || null,
            permissions: JSON.stringify(installation.permissions || {}),
            updatedAt: new Date(),
          },
        });
        logger.info('Updated GitHub installation from webhook', {
          oldId: existing.installationId,
          newId: installation.id,
          account: accountLogin,
        });
      }
    }
    res.status(200).json({ received: true });
    return;
  }

  // Handle GitHub App Repository additions/removals
  if (eventType === 'installation_repositories') {
    const { action, installation, repositories_added, repositories_removed } = req.body;
    if (installation?.id) {
      const reg = await prisma.gitHubInstallation.findUnique({
        where: { installationId: installation.id },
      });
      if (reg) {
        if (action === 'added' && Array.isArray(repositories_added)) {
          for (const r of repositories_added) {
            await prisma.repository.upsert({
              where: { githubRepoId: r.id },
              create: {
                organizationId: reg.organizationId,
                githubRepoId: r.id,
                fullName: r.full_name,
                name: r.name,
                owner: r.full_name.split('/')[0],
                defaultBranch: 'main',
                isPrivate: Boolean(r.private),
                isActive: true,
                autoReviewEnabled: true,
              },
              update: {
                fullName: r.full_name,
                name: r.name,
                isActive: true,
                autoReviewEnabled: true,
              },
            });
          }
          logger.info('Added repositories via webhook', { count: repositories_added.length, orgId: reg.organizationId });
        } else if (action === 'removed' && Array.isArray(repositories_removed)) {
          for (const r of repositories_removed) {
            await prisma.repository.updateMany({
              where: { githubRepoId: r.id, organizationId: reg.organizationId },
              data: { autoReviewEnabled: false, isActive: false },
            });
          }
          logger.info('Removed repositories via webhook', { count: repositories_removed.length, orgId: reg.organizationId });
        }
      }
    }
    res.status(200).json({ received: true });
    return;
  }

  // Handle Pull Request events
  if (eventType === 'pull_request') {
    const { action, pull_request, repository, installation } = req.body;

    if (action === 'closed' && pull_request && repository) {
      await prisma.pullRequest.updateMany({
        where: {
          repository: { fullName: repository.full_name },
          number: pull_request.number,
        },
        data: {
          state: pull_request.merged ? 'MERGED' : 'CLOSED',
          updatedAt: new Date(),
        },
      });
      res.status(200).json({ received: true, state: pull_request.merged ? 'MERGED' : 'CLOSED' });
      return;
    }

    if (['opened', 'reopened', 'synchronize'].includes(action) && pull_request && repository) {
      const repoFullName = repository.full_name;
      const ghInstallationId = installation?.id;

      // 4. Strict Tenant Isolation Check
      // Look up existing repository by fullName
      let repo = await prisma.repository.findFirst({
        where: { fullName: repoFullName },
        include: { organization: true },
      });

      if (!repo) {
        if (!ghInstallationId) {
          logger.warn('Webhook ignored: no installation id in payload for unknown repository', {
            repo: repoFullName,
          });
          res.status(200).json({ received: true, ignored: true, reason: 'NO_INSTALLATION_ID' });
          return;
        }

        // Resolve organization solely through registered GitHubInstallation
        const registeredInstallation = await prisma.gitHubInstallation.findUnique({
          where: { installationId: ghInstallationId },
        });

        if (!registeredInstallation) {
          logger.warn('Webhook ignored: installation not registered to any tenant organization', {
            installationId: ghInstallationId,
            repo: repoFullName,
          });
          res.status(200).json({ received: true, ignored: true, reason: 'UNREGISTERED_INSTALLATION' });
          return;
        }

        // Register repository under verified organization tenant
        repo = await prisma.repository.create({
          data: {
            organizationId: registeredInstallation.organizationId,
            githubRepoId: repository.id,
            fullName: repoFullName,
            name: repository.name,
            owner: repository.owner?.login || repoFullName.split('/')[0],
            defaultBranch: repository.default_branch || 'main',
            isPrivate: Boolean(repository.private),
            isActive: true,
            autoReviewEnabled: true,
          },
          include: { organization: true },
        });

        logger.info('Registered repository under tenant organization', {
          repo: repo.fullName,
          orgId: registeredInstallation.organizationId,
        });
      }

      if (repo && repo.autoReviewEnabled) {
        // Upsert Pull Request record
        const pr = await prisma.pullRequest.upsert({
          where: {
            repositoryId_number: {
              repositoryId: repo.id,
              number: pull_request.number,
            },
          },
          create: {
            repositoryId: repo.id,
            githubPrId: pull_request.id,
            number: pull_request.number,
            title: pull_request.title || 'Untitled Pull Request',
            author: pull_request.user?.login || 'unknown',
            authorAvatarUrl: pull_request.user?.avatar_url || null,
            baseBranch: pull_request.base?.ref || 'main',
            headBranch: pull_request.head?.ref || 'feature',
            headSha: pull_request.head?.sha || 'HEAD',
            state: pull_request.state?.toUpperCase() || 'OPEN',
          },
          update: {
            title: pull_request.title,
            headSha: pull_request.head?.sha,
            state: pull_request.state?.toUpperCase() || 'OPEN',
            updatedAt: new Date(),
          },
        });

        // Supersede any pending/queued review jobs on older commits for this PR
        await prisma.reviewJob.updateMany({
          where: {
            pullRequestId: pr.id,
            status: { in: ['QUEUED', 'FETCHING_DIFF', 'ANALYZING', 'VALIDATING'] },
            commitSha: { not: pr.headSha },
          },
          data: {
            status: 'SUPERSEDED',
            statusMessage: `Superseded by newer commit ${pr.headSha.substring(0, 7)}`,
            completedAt: new Date(),
          },
        });

        // Enqueue fresh ReviewJob with unique idempotencyKey
        const idempotencyKey = `review-${pr.id}-${pr.headSha}`;
        const existingJob = await prisma.reviewJob.findUnique({
          where: { idempotencyKey },
        });

        if (!existingJob) {
          // Atomic Monthly Quota Enforcement
          const quotaCheck = await checkAndIncrementReviewQuota(repo.organizationId, { isBillable: true });
          if (!quotaCheck.allowed) {
            logger.warn('Webhook review skipped: Organization reached monthly review quota', {
              repo: repo.fullName,
              prNumber: pr.number,
              orgId: repo.organizationId,
              limit: quotaCheck.limit,
              currentUsage: quotaCheck.currentUsage,
            });
            res.status(200).json({ received: true, enqueued: false, quotaExceeded: true, message: quotaCheck.message });
            return;
          }

          const reviewJob = await prisma.reviewJob.create({
            data: {
              pullRequestId: pr.id,
              commitSha: pr.headSha,
              status: 'QUEUED',
              idempotencyKey,
              statusMessage: 'Review job queued from GitHub webhook.',
            },
          });

          // Dispatch to durable BullMQ queue
          await enqueueReviewJob(reviewJob.id);

          logger.info('Enqueued review job for pull request', {
            repo: repo.fullName,
            prNumber: pr.number,
            jobId: reviewJob.id,
          });

          res.status(202).json({ received: true, enqueued: true, reviewJobId: reviewJob.id });
          return;
        }
      }
    }
  }

  res.status(200).json({ received: true });
});

// POST /api/v1/webhooks/stripe
webhooksRouter.post('/stripe', async (req: Request, res: Response) => {
  const stripeSignature = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;

  let event: Stripe.Event;

  // Real Signature Verification
  if (webhookSecret && webhookSecret !== 'whsec_mock_stripe_webhook') {
    const stripe = getStripeClient();
    if (!stripe || !stripeSignature || !rawBody) {
      res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'Stripe webhook signature and raw body are required.' } });
      return;
    }

    try {
      event = stripe.webhooks.constructEvent(rawBody, stripeSignature, webhookSecret);
    } catch (err: any) {
      logger.warn('Stripe webhook signature verification failed', { error: err.message });
      res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: `Invalid Stripe signature: ${err.message}` } });
      return;
    }
  } else if (config.isProduction) {
    res.status(500).json({ error: { code: 'STRIPE_NOT_CONFIGURED', message: 'STRIPE_WEBHOOK_SECRET must be configured in production.' } });
    return;
  } else {
    // In local development or unit test mode with mock keys
    event = req.body as Stripe.Event;
  }

  if (!event || !event.id) {
    res.status(400).json({ error: { code: 'INVALID_EVENT', message: 'Event payload invalid.' } });
    return;
  }

  // Idempotency Deduplication via WebhookEvent table
  const existingDelivery = await prisma.webhookEvent.findUnique({
    where: { deliveryId: event.id },
  });

  if (existingDelivery) {
    logger.info('Duplicate Stripe webhook event deduplicated', { eventId: event.id });
    res.status(200).json({ received: true, deduplicated: true });
    return;
  }

  // Persist WebhookEvent
  await prisma.webhookEvent.create({
    data: {
      deliveryId: event.id,
      eventType: event.type,
      status: 'PROCESSED',
      payloadJson: JSON.stringify(event),
      processedAt: new Date(),
    },
  });

  logger.info('Processing Stripe event', { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.client_reference_id || (session.metadata?.organizationId as string);
        const rawPlanTier = (session.metadata?.planTier as string) || 'PRO';
        const planTier = ['PRO', 'TEAM', 'ENTERPRISE'].includes(rawPlanTier.toUpperCase())
          ? rawPlanTier.toUpperCase()
          : 'PRO';

        if (orgId) {
          const customerId = (session.customer as string) || null;
          const subscriptionId = (session.subscription as string) || null;

          await prisma.organization.update({
            where: { id: orgId },
            data: {
              plan: planTier,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
            },
          });

          const existingSub = await prisma.subscription.findFirst({
            where: { organizationId: orgId },
          });

          const periodEnd = new Date(Date.now() + 30 * 24 * 3600 * 1000);

          if (existingSub) {
            await prisma.subscription.update({
              where: { id: existingSub.id },
              data: {
                plan: planTier,
                status: 'ACTIVE',
                stripeSubscriptionId: subscriptionId || undefined,
                currentPeriodEnd: periodEnd,
              },
            });
          } else {
            await prisma.subscription.create({
              data: {
                organizationId: orgId,
                stripeSubscriptionId: subscriptionId,
                plan: planTier,
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: periodEnd,
              },
            });
          }

          await prisma.auditLog.create({
            data: {
              organizationId: orgId,
              action: 'STRIPE_CHECKOUT_COMPLETED',
              resourceType: 'BILLING_SUBSCRIPTION',
              resourceId: subscriptionId,
              detailsJson: JSON.stringify({
                planTier,
                customerId,
                sessionId: session.id,
              }),
            },
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionId = subscription.id;

        const org = await prisma.organization.findFirst({
          where: {
            OR: [
              { stripeCustomerId: customerId },
              { stripeSubscriptionId: subscriptionId },
              { id: subscription.metadata?.organizationId || undefined },
            ],
          },
        });

        if (org) {
          const rawStatus = (subscription.status || '').toLowerCase();
          let status = 'ACTIVE';
          let planToSet = org.plan;

          // Determine plan tier from price or metadata
          const priceId = subscription.items?.data?.[0]?.price?.id;
          if (priceId === process.env.STRIPE_PRICE_ID_TEAM || subscription.metadata?.planTier === 'TEAM') {
            planToSet = 'TEAM';
          } else if (priceId === process.env.STRIPE_PRICE_ID_PRO || subscription.metadata?.planTier === 'PRO') {
            planToSet = 'PRO';
          }

          if (rawStatus === 'active') {
            status = 'ACTIVE';
          } else if (rawStatus === 'past_due' || rawStatus === 'unpaid') {
            status = 'PAST_DUE';
          } else if (rawStatus === 'canceled' || rawStatus === 'incomplete_expired') {
            status = 'CANCELED';
            planToSet = 'FREE';
          } else if (rawStatus === 'incomplete') {
            status = 'INCOMPLETE';
          }

          await prisma.organization.update({
            where: { id: org.id },
            data: {
              plan: planToSet,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
            },
          });

          const subAny = subscription as any;
          const periodStart = subAny.current_period_start
            ? new Date(subAny.current_period_start * 1000)
            : new Date();
          const periodEnd = subAny.current_period_end
            ? new Date(subAny.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 3600 * 1000);

          const existingSub = await prisma.subscription.findFirst({
            where: { organizationId: org.id },
          });

          if (existingSub) {
            await prisma.subscription.update({
              where: { id: existingSub.id },
              data: {
                stripeSubscriptionId: subscriptionId,
                plan: planToSet,
                status,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
              },
            });
          } else {
            await prisma.subscription.create({
              data: {
                organizationId: org.id,
                stripeSubscriptionId: subscriptionId,
                plan: planToSet,
                status,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
              },
            });
          }

          await prisma.auditLog.create({
            data: {
              organizationId: org.id,
              action: 'STRIPE_SUBSCRIPTION_UPDATED',
              resourceType: 'BILLING_SUBSCRIPTION',
              resourceId: subscriptionId,
              detailsJson: JSON.stringify({
                status,
                plan: planToSet,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              }),
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const org = await prisma.organization.findFirst({
          where: {
            OR: [
              { stripeCustomerId: customerId },
              { stripeSubscriptionId: subscription.id },
            ],
          },
        });

        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { plan: 'FREE' },
          });

          await prisma.subscription.updateMany({
            where: { organizationId: org.id },
            data: { status: 'CANCELED' },
          });

          await prisma.auditLog.create({
            data: {
              organizationId: org.id,
              action: 'STRIPE_SUBSCRIPTION_CANCELED',
              resourceType: 'BILLING_SUBSCRIPTION',
              resourceId: subscription.id,
              detailsJson: JSON.stringify({ customerId }),
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          const org = await prisma.organization.findFirst({
            where: { stripeCustomerId: customerId },
          });
          if (org) {
            await prisma.subscription.updateMany({
              where: { organizationId: org.id },
              data: { status: 'ACTIVE' },
            });
            await prisma.auditLog.create({
              data: {
                organizationId: org.id,
                action: 'STRIPE_INVOICE_PAYMENT_SUCCEEDED',
                resourceType: 'BILLING_INVOICE',
                resourceId: invoice.id,
                detailsJson: JSON.stringify({ amountPaid: invoice.amount_paid }),
              },
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          const org = await prisma.organization.findFirst({
            where: { stripeCustomerId: customerId },
          });
          if (org) {
            await prisma.subscription.updateMany({
              where: { organizationId: org.id },
              data: { status: 'PAST_DUE' },
            });
            await prisma.auditLog.create({
              data: {
                organizationId: org.id,
                action: 'STRIPE_INVOICE_PAYMENT_FAILED',
                resourceType: 'BILLING_INVOICE',
                resourceId: invoice.id,
                detailsJson: JSON.stringify({ attemptCount: invoice.attempt_count }),
              },
            });
          }
        }
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    logger.error('Error handling Stripe webhook fulfillment', { error: err.message, eventId: event.id });
    res.status(500).json({ error: { code: 'FULFILLMENT_FAILED', message: err.message } });
  }
});
