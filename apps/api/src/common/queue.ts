import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from './logger';
import { triggerImmediateReview, triggerImmediateIndex } from '../worker/embedded-worker';

export interface ReviewJobQueueData {
  reviewJobId: string;
}

let redisConnection: IORedis | null = null;
let reviewQueue: Queue<ReviewJobQueueData> | null = null;

export function getRedisConnection(): IORedis | null {
  if (redisConnection) return redisConnection;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn(`Redis connection retry limit reached (${times}).`);
          return null;
        }
        return Math.min(times * 1000, 3000);
      },
    });

    redis.on('error', (err) => {
      logger.warn(`Redis connection notice: ${err.message}`);
    });

    redisConnection = redis;
    return redis;
  } catch (err: any) {
    logger.warn(`Redis unavailable: ${err?.message}`);
    return null;
  }
}

export function getReviewQueue(): Queue<ReviewJobQueueData> | null {
  if (reviewQueue) return reviewQueue;

  const redis = getRedisConnection();
  if (!redis) return null;

  try {
    reviewQueue = new Queue<ReviewJobQueueData>('review-jobs', {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
    return reviewQueue;
  } catch (err: any) {
    logger.warn(`Failed to initialize BullMQ queue: ${err?.message}`);
    return null;
  }
}

export async function enqueueReviewJob(reviewJobId: string): Promise<boolean> {
  // 1. Trigger immediate in-process embedded worker execution
  triggerImmediateReview(reviewJobId);

  // 2. Also try BullMQ if Redis is configured (for external worker architectures)
  const queue = getReviewQueue();
  if (queue) {
    try {
      await queue.add('process-review', { reviewJobId }, { jobId: reviewJobId });
      logger.info(`Durable BullMQ review job enqueued: ${reviewJobId}`);
      return true;
    } catch (err: any) {
      logger.warn(`BullMQ add notice (job processed by embedded worker): ${err.message}`);
    }
  }
  return true;
}

export async function enqueueIndexJob(indexJobId: string): Promise<boolean> {
  // 1. Trigger immediate in-process embedded worker execution
  triggerImmediateIndex(indexJobId);

  // 2. Also try BullMQ if Redis is configured
  const queue = getReviewQueue();
  if (queue) {
    try {
      await queue.add('process-index' as any, { reviewJobId: indexJobId } as any, { jobId: `index-${indexJobId}` });
      logger.info(`Durable BullMQ index job enqueued: ${indexJobId}`);
      return true;
    } catch (err: any) {
      logger.warn(`BullMQ index add notice (job processed by embedded worker): ${err.message}`);
    }
  }
  return true;
}

