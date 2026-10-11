# ReviewFlow AI — GitHub Webhook Architecture & Event Processing

## 1. Webhook Ingestion Flow

GitHub App webhooks trigger automated pull request reviews whenever code is created or updated.

```mermaid
sequenceDiagram
    autonumber
    participant GH as GitHub Webhooks API
    participant API as ReviewFlow API (/api/v1/webhooks/github)
    participant SEC as HMAC Signature Verifier
    participant DB as Database (WebhookEvent)
    participant Q as Redis Queue (BullMQ)
    participant W as ReviewFlow Worker

    GH->>API: POST Event (headers: X-GitHub-Delivery, X-Hub-Signature-256)
    API->>SEC: Verify raw body buffer against GITHUB_WEBHOOK_SECRET
    alt Invalid Signature
        SEC-->>API: Signature Mismatch
        API-->>GH: HTTP 401 Unauthorized
    else Valid Signature
        SEC-->>API: Valid HMAC-SHA256
        API->>DB: Check & Record X-GitHub-Delivery ID (Idempotency Guard)
        alt Duplicate Delivery ID
            DB-->>API: Unique constraint collision
            API-->>GH: HTTP 200 OK (Duplicate ignored)
        else Fresh Delivery
            DB-->>API: Stored fresh event record
            API->>Q: Enqueue ReviewJob (repoId, prNumber, headSha)
            API-->>GH: HTTP 200 OK (Accepted for background processing)
            Q->>W: Process Review Job Asynchronously
        end
    end
```

---

## 2. Handled GitHub Webhook Events

| GitHub Event | Action Triggered | ReviewFlow Behavior |
| :--- | :--- | :--- |
| `pull_request.opened` | Pull Request Created | Checks repository `autoReviewEnabled` policy. If active, initializes `ReviewJob` and enqueues analysis. |
| `pull_request.synchronize` | New Commits Pushed | Automatically marks any pending review jobs for previous commit SHAs as `SUPERSEDED`, and enqueues a fresh review for the new `headSha`. |
| `pull_request.reopened` | Pull Request Reopened | Re-evaluates pull request state against default policy. |
| `installation.created` | GitHub App Installed | Syncs account login, organization identifier, and permissions. |
| `installation.deleted` | GitHub App Uninstalled | Soft-deactivates connected repositories and cleans active webhook listeners. |

---

## 3. Webhook Security Safeguards
1. **Raw Body Streaming Verification:** Signature computation uses the untransformed binary stream prior to JSON deserialization.
2. **Replay Defense:** The `WebhookEvent` table enforces a unique constraint on `deliveryId`.
3. **Bounded Processing Limits:** Webhooks acknowledge within 250ms; expensive LLM calls and git operations execute strictly on background workers.
