import { prisma } from '@reviewflow/database';
import { processReviewJob } from './processors/review-job-processor';

let isRunning = true;

async function runWorkerLoop() {
  console.log('👷 ReviewFlow AI Background Worker started.');
  console.log('   Polling for QUEUED review jobs...');

  while (isRunning) {
    try {
      const pendingJobs = await prisma.reviewJob.findMany({
        where: { status: 'QUEUED' },
        take: 5,
        orderBy: { createdAt: 'asc' },
      });

      for (const job of pendingJobs) {
        if (!isRunning) break;
        await processReviewJob(job.id);
      }
    } catch (err) {
      console.error('[Worker] Polling error:', err);
    }

    // Wait 3 seconds between polling loops
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

process.on('SIGTERM', () => {
  console.log('[Worker] SIGTERM received. Shutting down gracefully...');
  isRunning = false;
});

process.on('SIGINT', () => {
  console.log('[Worker] SIGINT received. Shutting down gracefully...');
  isRunning = false;
});

runWorkerLoop();
