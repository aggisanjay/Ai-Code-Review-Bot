import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Strict security validation in production
if (isProduction) {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === 'dev-insecure-secret-change-in-production-min-32-chars-long' ||
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error('FATAL: A secure, minimum 32-character JWT_SECRET must be configured in production.');
  }
  if (!process.env.GITHUB_APP_ID || !process.env.GITHUB_PRIVATE_KEY) {
    throw new Error('FATAL: GITHUB_APP_ID and GITHUB_PRIVATE_KEY must be configured on the server in production.');
  }
  if (
    !process.env.GITHUB_WEBHOOK_SECRET ||
    process.env.GITHUB_WEBHOOK_SECRET === 'development_webhook_secret_key'
  ) {
    throw new Error('FATAL: A unique, secure GITHUB_WEBHOOK_SECRET must be configured in production.');
  }
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-in-production-min-32-chars-long',
  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production-min-32-chars-long',
  githubAppId: process.env.GITHUB_APP_ID || '',
  githubAppSlug: process.env.GITHUB_APP_SLUG || 'reviewflow-ai',
  githubPrivateKey: process.env.GITHUB_PRIVATE_KEY || '',
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || 'development_webhook_secret_key',
  githubMockMode: isProduction ? false : process.env.GITHUB_MOCK_MODE === 'true',
  billingMockMode: isProduction ? false : process.env.BILLING_MOCK_MODE !== 'false',
  corsOrigin: process.env.CORS_ORIGIN || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  appUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
};
