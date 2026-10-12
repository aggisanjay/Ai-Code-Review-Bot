import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { verifyWebhookSignature } from '../../packages/github-client/src/webhook-verifier';

test('webhook-integration: signs and verifies genuine GitHub webhook payload with secret', () => {
  const secret = 'super-secret-github-webhook-token-12345';
  const payload = JSON.stringify({
    action: 'opened',
    pull_request: {
      number: 42,
      title: 'feat: add secure auth flow',
      head: { sha: 'a1b2c3d4e5f6' },
    },
    repository: {
      full_name: 'acme/webapp',
    },
    installation: {
      id: 88888,
    },
  });

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signatureHeader = `sha256=${hmac.digest('hex')}`;

  const isValid = verifyWebhookSignature({
    payload: Buffer.from(payload),
    signatureHeader,
    secret,
  });

  assert.equal(isValid, true, 'HMAC-SHA256 signature must verify correctly');
});

test('webhook-integration: rejects payload when secret or payload is altered', () => {
  const secret = 'super-secret-github-webhook-token-12345';
  const payload = JSON.stringify({ action: 'opened', number: 1 });

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signatureHeader = `sha256=${hmac.digest('hex')}`;

  const isInvalidSecret = verifyWebhookSignature({
    payload: Buffer.from(payload),
    signatureHeader,
    secret: 'wrong-secret',
  });

  const isInvalidPayload = verifyWebhookSignature({
    payload: Buffer.from(JSON.stringify({ action: 'tampered', number: 1 })),
    signatureHeader,
    secret,
  });

  assert.equal(isInvalidSecret, false);
  assert.equal(isInvalidPayload, false);
});
