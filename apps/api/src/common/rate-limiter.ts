import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();

// Clean expired records periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestMap.entries()) {
    if (now > record.resetTime) {
      ipRequestMap.delete(ip);
    }
  }
}, 60000);

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

export function createRateLimiter(options?: RateLimitOptions) {
  const windowMs = options?.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  const max = options?.max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '120', 10);
  const message = options?.message || 'Too many requests. Please slow down and try again later.';

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();

    const record = ipRequestMap.get(ip);

    if (!record || now > record.resetTime) {
      ipRequestMap.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    if (record.count >= max) {
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
        },
      });
      return;
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - record.count);
    next();
  };
}
