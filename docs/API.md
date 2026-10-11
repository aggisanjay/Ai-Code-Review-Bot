# ReviewFlow AI — RESTful API Specification

The ReviewFlow AI API is versioned under `/api/v1` and follows REST conventions with JSON payloads, standard HTTP status codes, structured error envelopes, and request correlation IDs.

---

## 1. Authentication & Tenant Authorization
All authenticated routes require a Bearer token or cookie session:
```http
Authorization: Bearer <jwt_token>
```
Cross-tenant access control is enforced at the controller and ORM layer. Requests attempting to query or modify resources outside the user's active organization membership return `403 Forbidden` or `404 Not Found`.

---

## 2. API Endpoints Overview

### Health & System Status
- **`GET /api/v1/health`**
  - **Description:** Verifies database, queue, and service uptime.
  - **Response (200 OK):**
    ```json
    {
      "status": "healthy",
      "timestamp": "2026-10-11T14:30:00.000Z",
      "version": "1.0.0",
      "service": "ReviewFlow AI API Server",
      "environment": "development",
      "integrations": {
        "githubMockMode": true,
        "billingMockMode": true
      }
    }
    ```

### Authentication (`/api/v1/auth`)
- **`POST /api/v1/auth/register`** — Register new user account.
- **`POST /api/v1/auth/login`** — Authenticate with email and password, minting a secure session token.
- **`GET /api/v1/auth/me`** — Retrieve currently authenticated user and active organization memberships.

### Repositories (`/api/v1/repositories`)
- **`GET /api/v1/repositories`** — List all connected repositories for the tenant.
- **`GET /api/v1/repositories/:id`** — Get repository metadata, sync status, and review policies.
- **`PATCH /api/v1/repositories/:id/policy`** — Update review rules (severity thresholds, diff limits, enabled categories, custom instructions).

### Pull Requests (`/api/v1/pull-requests`)
- **`GET /api/v1/pull-requests`** — List pull requests with review status badges and finding counts.
- **`GET /api/v1/pull-requests/:id`** — Retrieve pull request details, commit history, and review jobs.

### Reviews & Findings (`/api/v1/reviews`)
- **`GET /api/v1/reviews/:id`** — Get review job progress, tokens consumed, duration, and findings.
- **`POST /api/v1/reviews/:id/retry`** — Trigger re-analysis of a failed or superseded review.
- **`POST /api/v1/reviews/findings/:findingId/feedback`** — Submit developer feedback (Helpful / False Positive / Dismiss).

### Analytics & Billing (`/api/v1/analytics`, `/api/v1/billing`)
- **`GET /api/v1/analytics/overview`** — Aggregate review metrics, severity breakdown, and time saved.
- **`GET /api/v1/billing/subscription`** — Current plan entitlements, quota consumption, and period reset date.
- **`POST /api/v1/billing/checkout`** — Create Stripe Checkout session for Pro or Team upgrades.

### Webhooks (`/api/v1/webhooks`)
- **`POST /api/v1/webhooks/github`** — Ingest GitHub App webhook events with HMAC-SHA256 signature verification.
- **`POST /api/v1/webhooks/stripe`** — Ingest verified Stripe subscription lifecycle events.

---

## 3. Standard Error Envelope
All API errors return a uniform schema:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Field 'severityThreshold' must be one of: CRITICAL, HIGH, MEDIUM, LOW, INFO",
    "correlationId": "k9x2m4p1"
  }
}
```
