import test from 'node:test';
import assert from 'node:assert/strict';
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
