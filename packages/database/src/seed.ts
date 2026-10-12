import { prisma } from './index';

export async function seedDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: Database seeding is prohibited in production environment.');
  }

  console.log('🌱 Seeding ReviewFlow AI database with realistic test fixture data for local development...');

  // Clean existing data for idempotency
  await prisma.findingFeedback.deleteMany();
  await prisma.finding.deleteMany();
  await prisma.reviewResult.deleteMany();
  await prisma.reviewJob.deleteMany();
  await prisma.pullRequestCommit.deleteMany();
  await prisma.pullRequest.deleteMany();
  await prisma.reviewPolicy.deleteMany();
  await prisma.repository.deleteMany();
  await prisma.gitHubInstallation.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.usageRecord.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.session.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Demo User (Alex Chen - Staff Software Engineer)
  // Password hash for 'Password123!' (using standard bcrypt/argon dummy hash)
  const user = await prisma.user.create({
    data: {
      email: 'alex@reviewflow.ai',
      name: 'Alex Chen',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$qUfS2qgZ0UvX0eF+wP6zZ4j8Q7y6F2G1M9K0A3B5C7D', // seeded password
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 2. Create Organization (Acme Cloud Technologies)
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Cloud Technologies',
      slug: 'acme-cloud',
      plan: 'PRO',
      stripeCustomerId: 'cus_mock_9823412',
      stripeSubscriptionId: 'sub_mock_8817234',
    },
  });

  // 3. Add User as Org Owner
  await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      role: 'OWNER',
    },
  });

  // 4. Create GitHub App Installation
  await prisma.gitHubInstallation.create({
    data: {
      organizationId: org.id,
      installationId: 4892019,
      accountLogin: 'acme-cloud',
      accountType: 'Organization',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      permissions: JSON.stringify({
        pull_requests: 'write',
        checks: 'write',
        contents: 'read',
        metadata: 'read',
      }),
    },
  });

  // 5. Connect Repositories
  const repoApi = await prisma.repository.create({
    data: {
      organizationId: org.id,
      githubRepoId: 819203,
      fullName: 'acme-cloud/api-gateway',
      name: 'api-gateway',
      owner: 'acme-cloud',
      defaultBranch: 'main',
      isPrivate: true,
      isActive: true,
      autoReviewEnabled: true,
      lastReviewAt: new Date(),
    },
  });

  const repoAuth = await prisma.repository.create({
    data: {
      organizationId: org.id,
      githubRepoId: 819204,
      fullName: 'acme-cloud/auth-service',
      name: 'auth-service',
      owner: 'acme-cloud',
      defaultBranch: 'main',
      isPrivate: true,
      isActive: true,
      autoReviewEnabled: true,
      lastReviewAt: new Date(Date.now() - 3600000 * 2),
    },
  });

  const repoWeb = await prisma.repository.create({
    data: {
      organizationId: org.id,
      githubRepoId: 819205,
      fullName: 'acme-cloud/checkout-frontend',
      name: 'checkout-frontend',
      owner: 'acme-cloud',
      defaultBranch: 'main',
      isPrivate: false,
      isActive: true,
      autoReviewEnabled: true,
      lastReviewAt: new Date(Date.now() - 3600000 * 5),
    },
  });

  // 6. Review Policy for Organization
  await prisma.reviewPolicy.create({
    data: {
      organizationId: org.id,
      repositoryId: null, // Org-level policy
      enabledCategories: JSON.stringify([
        'SECURITY',
        'CORRECTNESS',
        'PERFORMANCE',
        'MAINTAINABILITY',
        'TESTING',
        'ARCHITECTURE',
      ]),
      severityThreshold: 'MEDIUM',
      blockPrOnCritical: true,
      autoPostInlineComments: true,
      autoCreateCheckRun: true,
      requireTestsForNewCode: true,
      maxDiffLines: 5000,
      customInstructions:
        'Enforce strict input sanitization, check for SQL/NoSQL injection, flag any missing try/catch in async endpoints, and verify unit tests cover edge cases.',
      excludedPaths: JSON.stringify(['dist/**', 'coverage/**', '*.lock']),
    },
  });

  // 7. Seed Pull Requests & Reviews

  // --- PR 1: Flagship PR with Critical Vulnerabilities ---
  const pr1 = await prisma.pullRequest.create({
    data: {
      repositoryId: repoAuth.id,
      githubPrId: 77201,
      number: 142,
      title: 'feat(auth): Add JWT refresh token rotation and cookie session handler',
      author: 'sarah-dev',
      authorAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      baseBranch: 'main',
      headBranch: 'feat/refresh-tokens',
      headSha: '8f7a1c3e90b2d4f8a1e2c3b4a5d6e7f8a9b0c1d2',
      state: 'OPEN',
    },
  });

  const job1 = await prisma.reviewJob.create({
    data: {
      pullRequestId: pr1.id,
      commitSha: pr1.headSha,
      status: 'COMPLETED',
      idempotencyKey: `review-${pr1.id}-${pr1.headSha}`,
      progressPercent: 100,
      statusMessage: 'Review successfully published to GitHub Checks and PR inline comments.',
      startedAt: new Date(Date.now() - 1000 * 60 * 20),
      completedAt: new Date(Date.now() - 1000 * 60 * 18),
      durationSeconds: 11.4,
      tokensUsed: 3840,
      estimatedCostUsd: 0.0192,
      publishedToGitHub: true,
      githubCheckRunId: 'check_run_9918237',
    },
  });

  const result1 = await prisma.reviewResult.create({
    data: {
      reviewJobId: job1.id,
      summary:
        'Analyzed 4 modified files (+184, -32 lines). Identified 1 CRITICAL security vulnerability, 1 HIGH severity race condition in token revocation, and 1 MEDIUM maintainability issue. Pull request should NOT be merged until cryptographic fallback and Redis atomic transactions are resolved.',
      overallRisk: 'CRITICAL',
      riskRationale:
        'Critical vulnerability: Hardcoded insecure fallback secret detected in JWT verification function, allowing token forgery in non-production or misconfigured environments. High risk: Non-atomic Redis token blacklist check prone to TOCTOU race conditions.',
      keyStrengths: JSON.stringify([
        'Good adoption of HttpOnly and SameSite=Strict cookie headers',
        'Clean modular separation between session service and controller',
        'Comprehensive TypeScript interfaces for token payloads',
      ]),
      blockers: JSON.stringify([
        'Fix hardcoded JWT fallback secret (Vulnerability RF-SEC-01)',
        'Wrap Redis blacklist revocation in an atomic Lua script or MULTI/EXEC transaction',
      ]),
      testCoverageAssessment:
        'Inadequate: New rotation endpoint lacks test cases for expired refresh tokens and concurrent rotation requests.',
      estimatedReviewTimeSavedMinutes: 45,
    },
  });

  // Findings for PR 1
  await prisma.finding.createMany({
    data: [
      {
        reviewResultId: result1.id,
        category: 'SECURITY',
        severity: 'CRITICAL',
        confidence: 98,
        filePath: 'src/services/token.service.ts',
        startLine: 42,
        endLine: 48,
        title: 'Hardcoded Cryptographic Fallback Secret in JWT Verification',
        explanation:
          'When process.env.JWT_REFRESH_SECRET is unset or empty, the verification falls back to a static string "default-secret-do-not-use-in-prod". An attacker can forge arbitrary admin session tokens against staging or incorrectly configured instances.',
        evidence: 'const secret = process.env.JWT_REFRESH_SECRET || "default-secret-do-not-use-in-prod";\nreturn jwt.verify(token, secret);',
        remediation:
          'Throw a fatal ConfigurationError if JWT_REFRESH_SECRET is not configured. Never provide a default fallback for cryptographic signing keys.',
        suggestedPatch: `const secret = process.env.JWT_REFRESH_SECRET;\nif (!secret || secret.length < 32) {\n  throw new Error("FATAL: JWT_REFRESH_SECRET must be configured with at least 32 characters.");\n}\nreturn jwt.verify(token, secret);`,
        ruleId: 'SEC-JWT-001',
        source: 'AI_ANALYSIS',
        githubCommentId: 'comment_gh_81920',
      },
      {
        reviewResultId: result1.id,
        category: 'SECURITY',
        severity: 'HIGH',
        confidence: 92,
        filePath: 'src/services/session.service.ts',
        startLine: 112,
        endLine: 125,
        title: 'Time-of-Check to Time-of-Use (TOCTOU) Race Condition in Token Blacklist',
        explanation:
          'The check for whether a token is revoked (isBlacklisted) and the subsequent invalidation are executed as separate asynchronous Redis commands without atomic locking or Redis transactions, allowing concurrent requests to reuse a revoked token.',
        evidence: 'const isRevoked = await redis.get(`blacklist:${tokenId}`);\nif (isRevoked) throw new UnauthorizedException();\n// ... network delay\nawait redis.set(`blacklist:${tokenId}`, "1");',
        remediation:
          'Use Redis atomic transaction (multi/exec) or an atomic SET with NX flag (SET blacklist:id 1 NX EX 86400) to atomically detect and prevent duplicate token reuse.',
        suggestedPatch: `const wasSet = await redis.set(\`blacklist:\${tokenId}\`, "1", "EX", 86400, "NX");\nif (!wasSet) {\n  throw new UnauthorizedException("Token has already been consumed or invalidated.");\n}`,
        ruleId: 'SEC-RACE-004',
        source: 'AI_ANALYSIS',
        githubCommentId: 'comment_gh_81921',
      },
      {
        reviewResultId: result1.id,
        category: 'PERFORMANCE',
        severity: 'MEDIUM',
        confidence: 88,
        filePath: 'src/controllers/auth.controller.ts',
        startLine: 78,
        endLine: 89,
        title: 'Missing Rate Limiting on Token Refresh Endpoint',
        explanation:
          'The /auth/refresh endpoint triggers database lookups and asymmetric crypto verification on every call but lacks rate limiting, making it vulnerable to denial-of-service and credential stuffing attacks.',
        evidence: '@Post("refresh")\nasync refreshToken(@Req() req: Request, @Res() res: Response) {',
        remediation:
          'Apply the strict rate limit middleware (e.g., @Throttle({ default: { limit: 10, ttl: 60000 } })) to prevent brute-force attacks.',
        suggestedPatch: `@Throttle({ default: { limit: 10, ttl: 60000 } })\n@Post("refresh")\nasync refreshToken(@Req() req: Request, @Res() res: Response) {`,
        ruleId: 'PERF-RATE-002',
        source: 'DETERMINISTIC_STATIC',
        githubCommentId: 'comment_gh_81922',
      },
      {
        reviewResultId: result1.id,
        category: 'TESTING',
        severity: 'LOW',
        confidence: 85,
        filePath: 'tests/auth/refresh.spec.ts',
        startLine: 1,
        endLine: 25,
        title: 'Missing Negative Test Suite for Expired Refresh Tokens',
        explanation:
          'Test suite only verifies the happy path with valid tokens. Expired tokens, malformed signatures, and blacklisted tokens are untested.',
        evidence: 'describe("RefreshToken", () => {\n  it("should refresh valid token", async () => { ... });\n});',
        remediation: 'Add unit tests covering expired token rejection, tampered signatures, and replay attempts.',
        suggestedPatch: `it("should reject expired refresh tokens with 401", async () => {\n  const expiredToken = createExpiredToken();\n  const res = await request(app).post("/auth/refresh").send({ refreshToken: expiredToken });\n  expect(res.status).toBe(401);\n});`,
        ruleId: 'TEST-COV-001',
        source: 'AI_ANALYSIS',
        githubCommentId: 'comment_gh_81923',
      },
    ],
  });

  // --- PR 2: High Reliability & Billing PR ---
  const pr2 = await prisma.pullRequest.create({
    data: {
      repositoryId: repoApi.id,
      githubPrId: 77202,
      number: 156,
      title: 'fix(billing): Update Stripe webhook idempotency check & subscription sync',
      author: 'david-k',
      authorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      baseBranch: 'main',
      headBranch: 'fix/stripe-idempotency',
      headSha: 'c4e2a8b91f0d3e5a7b9c1d2e3f4a5b6c7d8e9f0a',
      state: 'OPEN',
    },
  });

  const job2 = await prisma.reviewJob.create({
    data: {
      pullRequestId: pr2.id,
      commitSha: pr2.headSha,
      status: 'COMPLETED',
      idempotencyKey: `review-${pr2.id}-${pr2.headSha}`,
      progressPercent: 100,
      statusMessage: 'Review finished with 2 findings.',
      startedAt: new Date(Date.now() - 1000 * 60 * 120),
      completedAt: new Date(Date.now() - 1000 * 60 * 118),
      durationSeconds: 8.7,
      tokensUsed: 2950,
      estimatedCostUsd: 0.0147,
      publishedToGitHub: true,
      githubCheckRunId: 'check_run_9918238',
    },
  });

  const result2 = await prisma.reviewResult.create({
    data: {
      reviewJobId: job2.id,
      summary:
        'Reviewed 2 modified files (+45, -12 lines). Good improvements to Stripe event signature verification. Identified 1 HIGH concurrency issue and 1 MEDIUM error handling issue.',
      overallRisk: 'HIGH',
      riskRationale:
        'Database update for subscription status lacks a row-level lock or unique constraint on deliveryId, risking duplicate invoice credits if Stripe sends parallel retries.',
      keyStrengths: JSON.stringify([
        'Proper raw body buffer verification with stripe.webhooks.constructEvent',
        'Clear typing on incoming Stripe event payloads',
      ]),
      blockers: JSON.stringify([
        'Add unique constraint on stripeEventId in the database to prevent duplicate processing',
      ]),
      testCoverageAssessment: 'Acceptable. Includes mock Stripe webhook test fixtures.',
      estimatedReviewTimeSavedMinutes: 30,
    },
  });

  await prisma.finding.createMany({
    data: [
      {
        reviewResultId: result2.id,
        category: 'CORRECTNESS',
        severity: 'HIGH',
        confidence: 95,
        filePath: 'src/modules/billing/stripe.webhook.ts',
        startLine: 35,
        endLine: 44,
        title: 'Non-Atomic Webhook Event Deduplication',
        explanation:
          'Event lookup and insertion are done in two steps without a unique database constraint or transaction lock. If Stripe delivers the same event twice simultaneously, both workers may pass the check and execute duplicate fulfillment.',
        evidence: 'const existing = await db.webhookEvent.findFirst({ where: { deliveryId: event.id } });\nif (!existing) {\n  await fulfillSubscription(event);\n}',
        remediation:
          'Rely on a database UNIQUE constraint on deliveryId with an atomic upsert or try-catch on unique violation to guarantee exact-once execution.',
        suggestedPatch: `try {\n  await db.webhookEvent.create({ data: { deliveryId: event.id, status: 'PROCESSING' } });\n  await fulfillSubscription(event);\n} catch (err: any) {\n  if (err.code === 'P2002') return res.status(200).send({ received: true, deduplicated: true });\n  throw err;\n}`,
        ruleId: 'LOGIC-IDEM-002',
        source: 'AI_ANALYSIS',
      },
      {
        reviewResultId: result2.id,
        category: 'MAINTAINABILITY',
        severity: 'MEDIUM',
        confidence: 89,
        filePath: 'src/modules/billing/stripe.webhook.ts',
        startLine: 82,
        endLine: 88,
        title: 'Unhandled Async Error Swallowing in Subscription Sync',
        explanation:
          'The catch block logs a vague message and returns HTTP 200 without alerting or recording the failure in the audit log, masking downstream synchronization failures.',
        evidence: 'catch (e) {\n  console.log("error syncing subscription");\n  return res.sendStatus(200);\n}',
        remediation:
          'Log full structured error metadata and record a failure audit log before returning an error status or scheduled retry.',
        suggestedPatch: `catch (err) {\n  logger.error("Failed to sync Stripe subscription event", { error: err, eventId: event.id });\n  return res.status(500).json({ error: "Subscription sync failed" });\n}`,
        ruleId: 'MAINT-ERR-001',
        source: 'DETERMINISTIC_STATIC',
      },
    ],
  });

  // --- PR 3: Clean PR with Safe Status ---
  const pr3 = await prisma.pullRequest.create({
    data: {
      repositoryId: repoWeb.id,
      githubPrId: 77203,
      number: 168,
      title: 'refactor(ui): Optimize bundle size with dynamic imports and lazy hydration',
      author: 'elena-ui',
      authorAvatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      baseBranch: 'main',
      headBranch: 'perf/dynamic-imports',
      headSha: 'e9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
      state: 'OPEN',
    },
  });

  const job3 = await prisma.reviewJob.create({
    data: {
      pullRequestId: pr3.id,
      commitSha: pr3.headSha,
      status: 'COMPLETED',
      idempotencyKey: `review-${pr3.id}-${pr3.headSha}`,
      progressPercent: 100,
      statusMessage: 'All checks passed. No high-severity issues found.',
      startedAt: new Date(Date.now() - 1000 * 60 * 300),
      completedAt: new Date(Date.now() - 1000 * 60 * 298),
      durationSeconds: 6.2,
      tokensUsed: 2100,
      estimatedCostUsd: 0.0105,
      publishedToGitHub: true,
      githubCheckRunId: 'check_run_9918239',
    },
  });

  const result3 = await prisma.reviewResult.create({
    data: {
      reviewJobId: job3.id,
      summary:
        'Reviewed 5 modified files (+82, -114 lines). Great architectural improvements! Successfully reduced initial JavaScript bundle by ~42KB using Next.js dynamic imports with suspense fallbacks. 0 critical, 0 high, 1 informational observation.',
      overallRisk: 'SAFE',
      riskRationale: 'Refactor introduces clean code patterns with zero regressions or security implications.',
      keyStrengths: JSON.stringify([
        'Subtle loading skeletons provided for dynamic imports',
        'Bundle size analyzer confirms 42KB reduction',
        'Preserved SSR compatibility',
      ]),
      blockers: JSON.stringify([]),
      testCoverageAssessment: 'Good. Existing component specs pass without changes.',
      estimatedReviewTimeSavedMinutes: 20,
    },
  });

  await prisma.finding.create({
    data: {
      reviewResultId: result3.id,
      category: 'MAINTAINABILITY',
      severity: 'INFO',
      confidence: 82,
      filePath: 'src/components/analytics/ChartWrapper.tsx',
      startLine: 18,
      endLine: 24,
      title: 'Consider Specifying Explicit SSR False for Recharts Component',
      explanation:
        'When dynamically importing Recharts components in Next.js, setting { ssr: false } prevents hydration warning mismatches on responsive SVG charts.',
      evidence: 'const DynamicChart = dynamic(() => import("./Chart"), { loading: () => <Skeleton /> });',
      remediation: 'Add ssr: false to the dynamic import configuration.',
      suggestedPatch: `const DynamicChart = dynamic(() => import("./Chart"), {\n  ssr: false,\n  loading: () => <Skeleton />\n});`,
      ruleId: 'UI-SSR-003',
      source: 'AI_ANALYSIS',
    },
  });

  // 8. Create Usage & Subscription records
  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      stripeSubscriptionId: 'sub_mock_8817234',
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodStart: new Date(Date.now() - 1000 * 3600 * 24 * 14),
      currentPeriodEnd: new Date(Date.now() + 1000 * 3600 * 24 * 16),
      cancelAtPeriodEnd: false,
    },
  });

  await prisma.usageRecord.create({
    data: {
      organizationId: org.id,
      periodYear: new Date().getFullYear(),
      periodMonth: new Date().getMonth() + 1,
      reviewCount: 38,
      tokenCount: 112500,
      estimatedCostUsd: 0.5625,
    },
  });

  // 9. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: org.id,
        userId: user.id,
        action: 'GITHUB_INSTALLATION_CREATED',
        resourceType: 'GitHubInstallation',
        resourceId: '4892019',
        detailsJson: JSON.stringify({ accountLogin: 'acme-cloud' }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        organizationId: org.id,
        userId: user.id,
        action: 'REVIEW_POLICY_UPDATED',
        resourceType: 'ReviewPolicy',
        resourceId: org.id,
        detailsJson: JSON.stringify({ severityThreshold: 'MEDIUM', blockPrOnCritical: true }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        organizationId: org.id,
        userId: null,
        action: 'PULL_REQUEST_REVIEWED',
        resourceType: 'PullRequest',
        resourceId: pr1.id,
        detailsJson: JSON.stringify({ prNumber: 142, status: 'COMPLETED', findingsCount: 4 }),
        ipAddress: 'github-webhook-delivery',
        userAgent: 'GitHub-Hookshot/1.0',
      },
    ],
  });

  console.log('✅ ReviewFlow AI database seeded successfully!');
  console.log('   User: alex@reviewflow.ai (Password: Password123!)');
  console.log('   Organization: Acme Cloud Technologies (acme-cloud)');
  console.log('   Repositories: 3 connected (api-gateway, auth-service, checkout-frontend)');
  console.log('   Pull Requests: 3 with full reviews and real code findings');
}

// Execute directly if run as CLI script
if (process.argv[1]?.includes('seed')) {
  seedDatabase()
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
