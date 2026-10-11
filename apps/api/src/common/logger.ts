export interface LogMetadata {
  correlationId?: string;
  userId?: string;
  orgId?: string;
  [key: string]: unknown;
}

const REDACTED_KEYS = ['password', 'secret', 'token', 'authorization', 'cookie', 'key'];

function redactSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(redactSensitiveData);

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (REDACTED_KEYS.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = redactSensitiveData(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export const logger = {
  info: (message: string, meta?: LogMetadata) => {
    console.log(
      JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        message,
        ...(meta ? (redactSensitiveData(meta) as object) : {}),
      })
    );
  },
  warn: (message: string, meta?: LogMetadata) => {
    console.warn(
      JSON.stringify({
        level: 'WARN',
        timestamp: new Date().toISOString(),
        message,
        ...(meta ? (redactSensitiveData(meta) as object) : {}),
      })
    );
  },
  error: (message: string, meta?: LogMetadata) => {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        message,
        ...(meta ? (redactSensitiveData(meta) as object) : {}),
      })
    );
  },
};
