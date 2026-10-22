import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env reliably from current working directory or monorepo root
const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), '../..', '.env'),
  path.resolve(__dirname, '..', '..', '..', '.env'),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}
dotenv.config();

import http from 'http';
import { prisma } from '@reviewflow/database';
import { processReviewJob } from './processors/review-job-processor';
import { processIndexJob } from './processors/index-job-processor';
import { startBullMqWorker } from './queue';

let isRunning = true;

// Lightweight HTTP healthcheck server so Render Web Service detects an open port
const workerPort = process.env.WORKER_PORT || 5000;
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'reviewflow-worker', running: isRunning }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.on('error', (err: any) => {
  console.warn(`[Worker] Healthcheck server port ${workerPort} unavailable (${err.code}). Continuing worker execution.`);
});

try {
  server.listen(workerPort, () => {
    console.log(`📡 Worker healthcheck server listening on port ${workerPort}`);
  });
} catch (err: any) {
  console.warn(`[Worker] Failed to start HTTP healthcheck server: ${err.message}. Continuing worker execution.`);
}

async function runWorkerLoop() {
  console.log('👷 ReviewFlow AI Background Worker started.');
  console.log('   Environment:', process.env.NODE_ENV || 'development');
  console.log('   AI Provider:', process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : 'mock'));

  // Start BullMQ Worker
  const bullWorker = startBullMqWorker();
  if (bullWorker) {
    console.log('   BullMQ Redis Queue listener: ACTIVE');
  }

  console.log('   Durable database queue listener: ACTIVE');

  while (isRunning) {
    try {
      // 1. Process pending pull request review jobs (gives BullMQ priority if connected)
      const pendingJobs = await prisma.reviewJob.findMany({
        where: {
          status: 'QUEUED',
          ...(bullWorker ? { createdAt: { lt: new Date(Date.now() - 10000) } } : {}),
        },
        take: 5,
        orderBy: { createdAt: 'asc' },
      });

      for (const job of pendingJobs) {
        if (!isRunning) break;
        await processReviewJob(job.id);
      }

      // 2. Process pending repository indexing jobs
      const pendingIndexJobs = await prisma.repositoryIndexJob.findMany({
        where: { status: 'QUEUED' },
        take: 3,
        orderBy: { createdAt: 'asc' },
      });

      for (const indexJob of pendingIndexJobs) {
        if (!isRunning) break;
        await processIndexJob(indexJob.id);
      }
    } catch (err: any) {
      console.error('[Worker] Polling loop notice:', err?.message || err);
    }

    // Wait 2.5 seconds between polling iterations
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
}

process.on('SIGTERM', () => {
  console.log('[Worker] SIGTERM received. Shutting down gracefully...');
  isRunning = false;
  server.close();
});

process.on('SIGINT', () => {
  console.log('[Worker] SIGINT received. Shutting down gracefully...');
  isRunning = false;
  server.close();
});

runWorkerLoop();
