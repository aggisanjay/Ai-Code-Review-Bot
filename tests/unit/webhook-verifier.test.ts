import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyWebhookSignature } from '../../packages/github-client/src/webhook-verifier';

test('webhook-verifier: validates valid HMAC-SHA256 signature', () => {
  const secret = 'super_secret_webhook_key_123';
  const payload = JSON.stringify({ action: 'opened', pull_request: { id: 142 } });

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = `sha256=${hmac.digest('hex')}`;

  const isValid = verifyWebhookSignature({ payload, signatureHeader: signature, secret });
  assert.equal(isValid, true, 'Valid signature should verify to true');
});

test('webhook-verifier: rejects tampered payload or incorrect signature', () => {
  const secret = 'super_secret_webhook_key_123';
  const payload = JSON.stringify({ action: 'opened', pull_request: { id: 142 } });
  const tamperedPayload = JSON.stringify({ action: 'opened', pull_request: { id: 999 } });

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = `sha256=${hmac.digest('hex')}`;

  const isValid = verifyWebhookSignature({ payload: tamperedPayload, signatureHeader: signature, secret });
  assert.equal(isValid, false, 'Tampered payload should fail verification');
});

test('webhook-verifier: rejects malformed signature header without error', () => {
  const secret = 'super_secret_webhook_key_123';
  const payload = 'test_payload';

  assert.equal(verifyWebhookSignature({ payload, signatureHeader: 'invalid_format', secret }), false);
  assert.equal(verifyWebhookSignature({ payload, signatureHeader: undefined, secret }), false);
  assert.equal(verifyWebhookSignature({ payload, signatureHeader: 'sha256=123', secret }), false);
});
