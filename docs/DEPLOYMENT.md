# ReviewFlow AI — Production Deployment Guide

ReviewFlow AI is architected for zero-downtime, scalable deployment across modern cloud providers.

---

## 1. Production Architecture Overview

```
                        [ Cloudflare / Vercel Edge ]
                                     |
                                     v
                   [ apps/web — Next.js on Vercel / Node ]
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
[ apps/api — Fly.io / Render / ECS ]        [ Managed PostgreSQL & Redis ]
               |                                     ^
               +-------------------+                 |
                                   v                 |
                   [ apps/worker — Background Runner ]
```

---

## 2. Infrastructure Requirements
1. **Managed PostgreSQL:** Neon, AWS RDS Aurora, or Supabase.
2. **Managed Redis:** Upstash, AWS ElastiCache, or Redis Cloud.
3. **Container Registry:** GitHub Container Registry or AWS ECR.
4. **Secrets Manager:** AWS Secrets Manager, Doppler, or HashiCorp Vault.

---

## 3. Environment Variables for Production

| Variable | Description |
| :--- | :--- |
| `NODE_ENV` | Must be set to `production` |
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://user:pass@host:5432/reviewflow?sslmode=require`) |
| `REDIS_URL` | Redis cluster URI (`rediss://...`) |
| `GITHUB_APP_ID` | Production GitHub App numeric ID |
| `GITHUB_CLIENT_ID` | Production GitHub OAuth Client ID |
| `GITHUB_CLIENT_SECRET` | Production GitHub OAuth Secret |
| `GITHUB_WEBHOOK_SECRET` | 32+ character HMAC secret matching GitHub App webhook settings |
| `GITHUB_PRIVATE_KEY` | RSA PEM private key generated from GitHub App settings |
| `GITHUB_MOCK_MODE` | Set to `false` in production |
| `AI_PROVIDER` | `gemini` or `openai` |
| `GEMINI_API_KEY` | Google Gemini API key (for Gemini 1.5 Pro / Flash) |
| `OPENAI_API_KEY` | OpenAI API key (for GPT-4o / GPT-4o-mini) |
| `STRIPE_SECRET_KEY` | Live or test Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `BILLING_MOCK_MODE` | Set to `false` in production |

---

## 4. Database Migrations in Production
Before rolling out container updates:
```bash
npx prisma migrate deploy
```
*Note: Never run `prisma db push` in production as it can cause non-idempotent schema modifications.*
