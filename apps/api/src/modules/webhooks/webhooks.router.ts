import { Router, Request, Response } from 'express';
import { prisma } from '@reviewflow/database';
import { verifyWebhookSignature } from '@reviewflow/github-client';
import { config } from '../../common/config';
import { logger } from '../../common/logger';

export const webhooksRouter = Router();

// POST /api/v1/webhooks/github
webhooksRouter.post('/github', async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const deliveryId = (req.headers['x-github-delivery'] as string) || `del_${Date.now()}`;
  const eventType = (req.headers['x-github-event'] as string) || 'ping';

  // Use raw body if available, or stringified body
  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody || Buffer.from(JSON.stringify(req.body));

  // 1. Webhook Signature Verification
  // In development mock mode, if signature header is missing or is 'mock-signature', bypass
  const isMockDelivery = config.githubMockMode && (!signature || signature === 'mock-signature');
  if (!isMockDelivery) {
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

  // 2. Event Deduplication
  const existingDelivery = await prisma.webhookEvent.findUnique({
    where: { deliveryId },
  });

  if (existingDelivery) {
    logger.info('Duplicate webhook delivery ignored', { deliveryId });
    res.status(200).json({ received: true, deduplicated: true, status: existingDelivery.status });
    return;
  }

  // 3. Persist Event
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

  // 4. Handle pull_request event
  if (eventType === 'pull_request') {
    const { action, pull_request, repository } = req.body;

    if (['opened', 'reopened', 'synchronize'].includes(action) && pull_request && repository) {
      const repoFullName = repository.full_name;

      // Find connected repository
      let repo = await prisma.repository.findFirst({
        where: { fullName: repoFullName },
      });

      if (!repo) {
        // If repo not found, find first active organization or demo org to bind
        const defaultOrg = await prisma.organization.findFirst();
        if (defaultOrg) {
          repo = await prisma.repository.create({
            data: {
              organizationId: defaultOrg.id,
              githubRepoId: repository.id || 100000 + Math.floor(Math.random() * 900000),
              fullName: repoFullName,
              name: repository.name || repoFullName.split('/')[1],
              owner: repository.owner?.login || repoFullName.split('/')[0],
              defaultBranch: repository.default_branch || 'main',
              isPrivate: Boolean(repository.private),
              isActive: true,
              autoReviewEnabled: true,
            },
          });
        }
      }

      if (repo && repo.autoReviewEnabled) {
        // Upsert PR record
        const pr = await prisma.pullRequest.upsert({
          where: {
            repositoryId_number: {
              repositoryId: repo.id,
              number: pull_request.number,
            },
          },
          create: {
            repositoryId: repo.id,
            githubPrId: pull_request.id || 99999,
            number: pull_request.number,
            title: pull_request.title || 'Untitled Pull Request',
            author: pull_request.user?.login || 'unknown',
            authorAvatarUrl: pull_request.user?.avatar_url,
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

        // Create queued review job
        const idempotencyKey = `review-${pr.id}-${pr.headSha}`;
        const existingJob = await prisma.reviewJob.findUnique({
          where: { idempotencyKey },
        });

        if (!existingJob) {
          const reviewJob = await prisma.reviewJob.create({
            data: {
              pullRequestId: pr.id,
              commitSha: pr.headSha,
              status: 'QUEUED',
              idempotencyKey,
              statusMessage: 'Review job enqueued from GitHub webhook.',
            },
          });

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
  const event = req.body;
  logger.info('Received Stripe webhook event', { type: event?.type, id: event?.id });

  if (event?.type === 'customer.subscription.updated' || event?.type === 'customer.subscription.deleted') {
    const subObj = event.data?.object;
    if (subObj?.customer) {
      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: subObj.customer },
      });

      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            plan: event.type === 'customer.subscription.deleted' ? 'FREE' : org.plan,
          },
        });
      }
    }
  }

  res.json({ received: true });
});
