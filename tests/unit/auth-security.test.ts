import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../../apps/api/src/modules/auth/auth.router';
import { authenticateToken } from '../../apps/api/src/common/auth.middleware';

test('auth-security: password hashing produces salt and verifies correctly', () => {
  const password = 'SuperSecretPassword123!';
  const hash = hashPassword(password);

  assert.ok(hash.includes(':'), 'Hash must contain salt delimiter');
  assert.equal(verifyPassword(password, hash), true, 'Correct password must verify successfully');
  assert.equal(verifyPassword('WrongPassword!', hash), false, 'Wrong password must be rejected');
  assert.equal(verifyPassword('', hash), false, 'Empty password must be rejected');
  assert.equal(verifyPassword(password, 'invalid-hash-string'), false, 'Malformed hash must be rejected');
});

test('auth-security: authenticateToken rejects unauthenticated requests with 401 without demo bypass', async () => {
  let statusSet = 0;
  let responseData: any = null;
  let nextCalled = false;

  const mockReq: any = {
    headers: {},
    query: {},
  };

  const mockRes: any = {
    status(code: number) {
      statusSet = code;
      return {
        json(data: any) {
          responseData = data;
        },
      };
    },
  };

  await authenticateToken(mockReq, mockRes, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false, 'Middleware must not call next() when unauthenticated');
  assert.equal(statusSet, 401, 'Must respond with HTTP 401 Unauthorized');
  assert.equal(responseData?.error?.code, 'UNAUTHORIZED');
});

test('auth-security: authenticateToken rejects malformed or tampered JWT', async () => {
  let statusSet = 0;
  let responseData: any = null;
  let nextCalled = false;

  const mockReq: any = {
    headers: { authorization: 'Bearer invalid.tampered.token' },
    query: {},
  };

  const mockRes: any = {
    status(code: number) {
      statusSet = code;
      return {
        json(data: any) {
          responseData = data;
        },
      };
    },
  };

  await authenticateToken(mockReq, mockRes, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(statusSet, 401);
  assert.equal(responseData?.error?.code, 'INVALID_TOKEN');
});
