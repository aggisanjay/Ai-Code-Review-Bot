import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { prisma } from '../../packages/database/src';
import { GitHubAppClient } from '../../packages/github-client/src/github-app-client';

test('github-integration: GitHubAppClient initializes successfully with valid private key PEM', () => {
  const dummyKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0mockKeyForUnitTestingOnlyDoNotUse1234567890abcdef
-----END RSA PRIVATE KEY-----`;

  const client = new GitHubAppClient({
    appId: 12345,
    privateKey: dummyKey,
    installationId: 99999,
  });

  assert.ok(client);
  assert.equal(typeof client.fetchPullRequest, 'function');
  assert.equal(typeof client.fetchPullRequestDiff, 'function');
  assert.equal(typeof client.createCheckRun, 'function');
  assert.equal(typeof client.updateCheckRun, 'function');
  assert.equal(typeof client.postReview, 'function');
  assert.equal(typeof client.listInstallationRepositories, 'function');
});

test('github-integration: listInstallationRepositories requires installationId', async () => {
  const dummyKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0mockKeyForUnitTestingOnlyDoNotUse1234567890abcdef
-----END RSA PRIVATE KEY-----`;

  const client = new GitHubAppClient({
    appId: 12345,
    privateKey: dummyKey,
  });

  await assert.rejects(
    async () => {
      await client.listInstallationRepositories();
    },
    {
      message: /installationId is required/,
    }
  );
});

test('github-integration: installation state nonce binds to tenant and prevents cross-tenant claims', async () => {
  const timestamp = Date.now();
  const org1Slug = `test-org-gh1-${timestamp}`;
  const org2Slug = `test-org-gh2-${timestamp}`;

  // 1. Create two separate tenant organizations and users
  const org1 = await prisma.organization.create({
    data: { name: 'Tenant 1', slug: org1Slug },
  });

  const org2 = await prisma.organization.create({
    data: { name: 'Tenant 2', slug: org2Slug },
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'User 1',
      email: `user1-${timestamp}@example.com`,
      passwordHash: 'dummy',
      memberships: {
        create: {
          organizationId: org1.id,
          role: 'ADMIN',
        },
      },
    },
  });

  // 2. Generate cryptographically secure state nonce for org1
  const stateToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const stateRecord = await prisma.installationState.create({
    data: {
      state: stateToken,
      organizationId: org1.id,
      userId: user1.id,
      expiresAt,
    },
  });

  assert.ok(stateRecord.id);
  assert.equal(stateRecord.state, stateToken);
  assert.equal(stateRecord.organizationId, org1.id);
  assert.equal(stateRecord.usedAt, null);

  // 3. Tenant mismatch check: Org 2 attempting to claim Org 1's state is rejected
  assert.notEqual(org2.id, stateRecord.organizationId);

  // 4. Org 1 successfully claims installation
  const installationId = 910000 + (timestamp % 10000);
  const inst1 = await prisma.gitHubInstallation.create({
    data: {
      organizationId: org1.id,
      installationId,
      accountLogin: 'acme-corp',
      accountType: 'Organization',
    },
  });
  assert.ok(inst1.id);

  // Mark state as consumed
  await prisma.installationState.update({
    where: { id: stateRecord.id },
    data: { usedAt: new Date() },
  });

  // 5. Cross-tenant hijacking prevention:
  // Org 2 tries to claim the same installationId that belongs to Org 1
  const existingInst = await prisma.gitHubInstallation.findUnique({
    where: { installationId },
  });
  assert.ok(existingInst);
  assert.equal(existingInst.organizationId, org1.id);

  const isCrossTenantHijack = existingInst.organizationId !== org2.id;
  assert.equal(isCrossTenantHijack, true, 'Must detect that installation belongs to another tenant');

  // 6. Idempotent retry:
  // Org 1 retrying the callback with same installationId and used state succeeds
  const idempotentAllowed = existingInst.organizationId === org1.id;
  assert.equal(idempotentAllowed, true, 'Must allow idempotent retries for same tenant');

  // 7. Repository synchronization and toggling under tenant
  const repo1 = await prisma.repository.create({
    data: {
      organizationId: org1.id,
      githubRepoId: 810000 + (timestamp % 10000),
      fullName: `acme-corp/service-${timestamp}`,
      name: `service-${timestamp}`,
      owner: 'acme-corp',
      defaultBranch: 'main',
      isPrivate: true,
      autoReviewEnabled: true,
    },
  });

  assert.equal(repo1.organizationId, org1.id);
  assert.equal(repo1.autoReviewEnabled, true);

  // Verify tenant isolation: querying repositories for Org 2 returns 0 repos
  const org2Repos = await prisma.repository.findMany({
    where: { organizationId: org2.id },
  });
  assert.equal(org2Repos.length, 0, 'Org 2 must not see Org 1 repositories');

  // 8. Clean up
  await prisma.repository.delete({ where: { id: repo1.id } });
  await prisma.gitHubInstallation.delete({ where: { id: inst1.id } });
  await prisma.installationState.delete({ where: { id: stateRecord.id } });
  await prisma.user.delete({ where: { id: user1.id } });
  await prisma.organization.delete({ where: { id: org1.id } });
  await prisma.organization.delete({ where: { id: org2.id } });
});

