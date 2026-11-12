import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Enable automatic JSON serialization for Prisma BigInt fields
if (typeof BigInt !== 'undefined' && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
}

import { config } from './common/config';
import { logger } from './common/logger';
import { createRateLimiter } from './common/rate-limiter';
import { authRouter } from './modules/auth/auth.router';
import { organizationsRouter } from './modules/organizations/organizations.router';
import { repositoriesRouter } from './modules/repositories/repositories.router';
import { pullRequestsRouter } from './modules/pull-requests/pull-requests.router';
import { reviewsRouter } from './modules/reviews/reviews.router';
import { analyticsRouter } from './modules/analytics/analytics.router';
import { billingRouter } from './modules/billing/billing.router';
import { webhooksRouter } from './modules/webhooks/webhooks.router';
import { startEmbeddedWorker, stopEmbeddedWorker } from './worker/embedded-worker';

const app = express();

// Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  );
  next();
});

// Middleware: CORS with validated origin
const allowedOrigins = [
  config.corsOrigin,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server webhook forwards)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else if (config.isProduction) {
        callback(new Error(`CORS blocked: Origin "${origin}" is not authorized.`));
      } else {
        callback(null, true); // Permissive in development only
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
  })
);

// Middleware: Capture raw body for webhook verification
app.use(
  express.json({
    limit: '10mb',
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as unknown as { rawBody: Buffer }).rawBody = buf;
    },
  })
);

// Request correlation & logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || Math.random().toString(36).substring(2, 10);
  (req as unknown as { correlationId: string }).correlationId = correlationId;
  next();
});

// Rate Limiter
app.use(createRateLimiter());

// Health & Readiness Endpoint
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'ReviewFlow AI API Server',
    environment: config.nodeEnv,
    integrations: {
      githubMockMode: config.githubMockMode,
      billingMockMode: config.billingMockMode,
    },
  });
});

// OpenAPI Spec Endpoint
app.get('/api/v1/openapi.json', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'ReviewFlow AI API',
      version: '1.0.0',
      description: 'API for ReviewFlow AI pull-request review platform and GitHub integration.',
    },
    paths: {
      '/api/v1/health': { get: { summary: 'Health check' } },
      '/api/v1/auth/register': { post: { summary: 'Register user' } },
      '/api/v1/auth/login': { post: { summary: 'Log in user' } },
      '/api/v1/auth/me': { get: { summary: 'Get current user profile' } },
      '/api/v1/organizations': { get: { summary: 'List user organizations' } },
      '/api/v1/repositories': { get: { summary: 'List repositories' } },
      '/api/v1/pull-requests': { get: { summary: 'List pull requests' } },
      '/api/v1/reviews/{id}': { get: { summary: 'Get review job details' } },
      '/api/v1/analytics/overview': { get: { summary: 'Get analytics summary' } },
      '/api/v1/billing/subscription': { get: { summary: 'Get subscription & usage' } },
      '/api/v1/webhooks/github': { post: { summary: 'GitHub App webhook endpoint' } },
    },
  });
});

// Mount Feature Routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/organizations', organizationsRouter);
app.use('/api/v1/repositories', repositoriesRouter);
app.use('/api/v1/pull-requests', pullRequestsRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/webhooks', webhooksRouter);

// Centralized Error Handling Middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const correlationId = (req as unknown as { correlationId?: string }).correlationId;
  logger.error('Unhandled API exception', { error: err.message, stack: err.stack, correlationId });

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.nodeEnv === 'production' ? 'An unexpected server error occurred.' : err.message,
      correlationId,
    },
  });
});

const server = app.listen(config.port, () => {
  logger.info(`🚀 ReviewFlow AI API Server running on port ${config.port} (${config.nodeEnv})`);
  startEmbeddedWorker();
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, closing server gracefully...');
  stopEmbeddedWorker();
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, closing server gracefully...');
  stopEmbeddedWorker();
  server.close(() => process.exit(0));
});

export default app;
