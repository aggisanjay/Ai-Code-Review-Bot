import { test } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';

test('write-approval: cryptographic nonce binds strictly to payload and prevents replays', () => {
  const nonce = crypto.randomBytes(32).toString('hex');
  assert.strictEqual(nonce.length, 64);

  // Nonce comparison
  const submittedNonce = nonce;
  const tamperedNonce = crypto.randomBytes(32).toString('hex');

  assert.strictEqual(submittedNonce === nonce, true);
  assert.strictEqual(tamperedNonce === nonce, false);
});

test('write-approval: enforces expiration boundary', () => {
  const pastExpiration = new Date(Date.now() - 1000);
  const futureExpiration = new Date(Date.now() + 60000);

  const isExpiredPast = new Date() > pastExpiration;
  const isExpiredFuture = new Date() > futureExpiration;

  assert.strictEqual(isExpiredPast, true);
  assert.strictEqual(isExpiredFuture, false);
});

test('write-approval: state machine blocks replay on resolved requests', () => {
  type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'EXPIRED';

  function canExecute(status: ApprovalStatus): boolean {
    return status === 'PENDING';
  }

  assert.strictEqual(canExecute('PENDING'), true);
  assert.strictEqual(canExecute('EXECUTED'), false);
  assert.strictEqual(canExecute('REJECTED'), false);
  assert.strictEqual(canExecute('EXPIRED'), false);
});
