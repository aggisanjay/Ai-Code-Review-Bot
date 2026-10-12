import test from 'node:test';
import assert from 'node:assert/strict';
import { GitHubAppClient } from '../../packages/github-client/src/github-app-client';

test('github-app-client: rejects missing appId or privateKey visibly', () => {
  assert.throws(
    () => {
      new GitHubAppClient({ appId: '', privateKey: '' });
    },
    {
      message: /GITHUB_APP_ID and GITHUB_PRIVATE_KEY must be specified/,
    }
  );
});

test('github-app-client: rejects malformed private key format', () => {
  assert.throws(
    () => {
      new GitHubAppClient({ appId: '123456', privateKey: 'not-a-valid-pem-key' });
    },
    {
      message: /not a valid RSA Private Key/,
    }
  );
});

test('github-app-client: throws when performing repo operation without installationId', async () => {
  const dummyKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0mockKeyForUnitTestingOnlyDoNotUse1234567890abcdef
-----END RSA PRIVATE KEY-----`;

  const client = new GitHubAppClient({
    appId: '12345',
    privateKey: dummyKey,
  });

  await assert.rejects(
    async () => {
      await client.fetchPullRequest('acme', 'repo', 1);
    },
    {
      message: /installationId is required/,
    }
  );
});
