import test from 'node:test';
import assert from 'node:assert/strict';
import { requireRole } from '../../apps/api/src/common/auth.middleware';

test('security: multi-tenant RBAC blocks insufficient roles', () => {
  const middleware = requireRole(['OWNER', 'ADMIN']);

  let nextCalled = false;
  let responseStatusCode = 0;
  let responseJson: any = null;

  const mockRes = {
    status: (code: number) => {
      responseStatusCode = code;
      return {
        json: (data: any) => {
          responseJson = data;
        },
      };
    },
  };

  // Test Member trying to access Admin action
  const memberReq: any = {
    user: { id: 'u1', email: 'member@test.com', organizationId: 'org1', role: 'MEMBER' },
  };

  middleware(memberReq, mockRes as any, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false, 'Member must not be allowed to proceed');
  assert.equal(responseStatusCode, 403, 'Should respond with HTTP 403 Forbidden');
  assert.equal(responseJson?.error?.code, 'FORBIDDEN');

  // Test Admin accessing Admin action
  nextCalled = false;
  responseStatusCode = 0;
  const adminReq: any = {
    user: { id: 'u2', email: 'admin@test.com', organizationId: 'org1', role: 'ADMIN' },
  };

  middleware(adminReq, mockRes as any, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true, 'Admin must be permitted to proceed');
});
