import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { processReviewJob } from './processors/review-job-processor';

export function startBullMqWorker(): Worker | null {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    const redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Worker] Redis not available on %s, falling back to durable DB polling.', redisUrl);
          return null;
        }
        return Math.min(times * 1000, 3000);
      },
    });

    redis.on('error', (err) => {
      // Keep logs informative without crashing
    });

    const worker = new Worker(
      'review-jobs',
      async (job: Job<{ reviewJobId: string }>) => {
        console.log(`[BullMQ Worker] Picked up job ${job.id} for ReviewJob ${job.data.reviewJobId}`);
        await processReviewJob(job.data.reviewJobId);
      },
      {
        connection: redis,
        concurrency: 5,
      }
    );

    worker.on('completed', (job) => {
      console.log(`[BullMQ Worker] Job ${job.id} completed successfully.`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[BullMQ Worker] Job ${job?.id} failed with error:`, err);
    });

    return worker;
  } catch (err: any) {
    console.warn(`[BullMQ Worker] Redis worker init notice: ${err?.message}`);
    return null;
  }
}
