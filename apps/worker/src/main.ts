import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { prisma } from '@reviewflow/database';
import { processReviewJob } from './processors/review-job-processor';
import { startBullMqWorker } from './queue';

let isRunning = true;

// Lightweight HTTP healthcheck server so Render Web Service detects an open port
const port = process.env.PORT || 5000;
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'reviewflow-worker', running: isRunning }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(port, () => {
  console.log(`📡 Worker healthcheck server listening on port ${port}`);
});

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
      const pendingJobs = await prisma.reviewJob.findMany({
        where: { status: 'QUEUED' },
        take: 5,
        orderBy: { createdAt: 'asc' },
      });

      for (const job of pendingJobs) {
        if (!isRunning) break;
        await processReviewJob(job.id);
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
