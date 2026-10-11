# ReviewFlow AI — Local Development & Quickstart Guide

ReviewFlow AI is built to run standalone locally without external cloud dependencies by default (using SQLite and Mock GitHub/Stripe adapters).

---

## 1. Prerequisites
- Node.js `v20+` or `v24+` (verified on v24.18.0)
- npm `v10+` (verified on v11.12.0)
- Optional: Docker and Docker Compose (for production PostgreSQL and Redis testing)

---

## 2. One-Time Setup

```bash
# 1. Clone repository & install dependencies
git clone <repo-url>
cd Ai-Code-Review-Bot
npm install

# 2. Configure environment
# Copy .env.example to .env (preconfigured with local SQLite & mock adapters)
cp .env.example .env

# 3. Synchronize database & seed realistic SaaS fixtures
npm run db:generate
npm run db:push
npm run db:seed
```

Seeding automatically populates:
- **User:** `alex@reviewflow.ai` (Password: `Password123!`)
- **Organization:** Acme Cloud Technologies (`acme-cloud`)
- **Repositories:** `api-gateway`, `auth-service`, `checkout-frontend`
- **Pull Requests:** PR #142 (Flagship JWT rotation review with live inline findings)

---

## 3. Running Services

### Start Web Frontend
```bash
npm run dev:web
# Launches Next.js at http://localhost:3000
```

### Start API Server
```bash
npm run dev:api
# Launches REST API server at http://localhost:4000
# Health check: http://localhost:4000/api/v1/health
# OpenAPI spec: http://localhost:4000/api/v1/openapi.json
```

### Start Background Worker
```bash
npm run dev:worker
# Launches review job processor
```

---

## 4. Running the Automated Test Suite

```bash
# Run all test suites (Unit, Security, Integration)
npm test

# Run individual suites
npm run test:unit
npm run test:security
npm run test:integration
```
