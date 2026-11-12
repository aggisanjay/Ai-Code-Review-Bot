import { prisma } from '@reviewflow/database';
import { processReviewJob } from './review-job-processor';
import { processIndexJob } from './index-job-processor';

const activeJobs = new Set<string>();
let isWorkerRunning = false;
let pollingTimer: NodeJS.Timeout | null = null;

/**
 * Triggers an immediate in-process execution of a review job without waiting for the polling loop.
 */
export function triggerImmediateReview(reviewJobId: string): void {
  if (activeJobs.has(reviewJobId)) {
    console.log(`[EmbeddedWorker] Job ${reviewJobId} is already running in-process.`);
    return;
  }

  setImmediate(async () => {
    activeJobs.add(reviewJobId);
    try {
      console.log(`[EmbeddedWorker] Executing immediate review for job ${reviewJobId}`);
      await processReviewJob(reviewJobId);
    } catch (err: any) {
      console.error(`[EmbeddedWorker] Error processing immediate review job ${reviewJobId}:`, err?.message || err);
    } finally {
      activeJobs.delete(reviewJobId);
    }
  });
}

/**
 * Triggers an immediate in-process execution of a repository indexing job.
 */
export function triggerImmediateIndex(indexJobId: string): void {
  if (activeJobs.has(indexJobId)) {
    console.log(`[EmbeddedWorker] Index job ${indexJobId} is already running in-process.`);
    return;
  }

  setImmediate(async () => {
    activeJobs.add(indexJobId);
    try {
      console.log(`[EmbeddedWorker] Executing immediate index for job ${indexJobId}`);
      await processIndexJob(indexJobId);
    } catch (err: any) {
      console.error(`[EmbeddedWorker] Error processing immediate index job ${indexJobId}:`, err?.message || err);
    } finally {
      activeJobs.delete(indexJobId);
    }
  });
}

async function pollAndProcess(): Promise<void> {
  if (!isWorkerRunning) return;

  try {
    // 1. Recover stale or orphaned jobs that got stuck (e.g. server restarted during analysis)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await prisma.reviewJob.updateMany({
      where: {
        status: { in: ['FETCHING_DIFF', 'ANALYZING', 'VALIDATING', 'PUBLISHING'] },
        updatedAt: { lt: tenMinutesAgo },
      },
      data: {
        status: 'QUEUED',
        statusMessage: 'Recovered from interrupted container restart. Re-queued for analysis.',
      },
    });

    // 2. Fetch queued review jobs
    const queuedReviewJobs = await prisma.reviewJob.findMany({
      where: { status: 'QUEUED' },
      take: 5,
      orderBy: { createdAt: 'asc' },
    });

    for (const job of queuedReviewJobs) {
      if (!isWorkerRunning) break;
      if (activeJobs.has(job.id)) continue;

      activeJobs.add(job.id);
      // Process asynchronously so we don't stall the event loop or other jobs
      (async () => {
        try {
          await processReviewJob(job.id);
        } catch (err: any) {
          console.error(`[EmbeddedWorker] Review job error (${job.id}):`, err?.message || err);
        } finally {
          activeJobs.delete(job.id);
        }
      })();
    }

    // 3. Fetch queued index jobs
    const queuedIndexJobs = await prisma.repositoryIndexJob.findMany({
      where: { status: 'QUEUED' },
      take: 2,
      orderBy: { createdAt: 'asc' },
    });

    for (const indexJob of queuedIndexJobs) {
      if (!isWorkerRunning) break;
      if (activeJobs.has(indexJob.id)) continue;

      activeJobs.add(indexJob.id);
      (async () => {
        try {
          await processIndexJob(indexJob.id);
        } catch (err: any) {
          console.error(`[EmbeddedWorker] Index job error (${indexJob.id}):`, err?.message || err);
        } finally {
          activeJobs.delete(indexJob.id);
        }
      })();
    }
  } catch (err: any) {
    // Keep polling loop resilient to transient network/db blips
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[EmbeddedWorker] Polling loop notice: ${err?.message || err}`);
    }
  } finally {
    if (isWorkerRunning) {
      pollingTimer = setTimeout(pollAndProcess, 3000);
    }
  }
}

/**
 * Starts the embedded background worker inside the API process.
 */
export function startEmbeddedWorker(): void {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  console.log('👷 Embedded ReviewFlow AI Worker started inside API process.');
  console.log('   Polling frequency: every 3000ms');
  console.log('   Zero-redis in-process execution: ACTIVE');

  // Kick off first cycle after a slight delay to let server boot cleanly
  pollingTimer = setTimeout(pollAndProcess, 1000);
}

/**
 * Stops the embedded background worker gracefully.
 */
export function stopEmbeddedWorker(): void {
  isWorkerRunning = false;
  if (pollingTimer) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
  console.log('👷 Embedded ReviewFlow AI Worker stopped.');
}

