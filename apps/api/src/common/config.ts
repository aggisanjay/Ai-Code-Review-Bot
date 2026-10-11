import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-in-production-min-32-chars-long',
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || 'development_webhook_secret_key',
  githubMockMode: process.env.GITHUB_MOCK_MODE !== 'false',
  billingMockMode: process.env.BILLING_MOCK_MODE !== 'false',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
