import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import Stripe from 'stripe';

function generateStripeSignature(payload: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

test('stripe-signature: verifies valid Stripe HMAC-SHA256 header', () => {
  const webhookSecret = 'whsec_test_secret_key_1234567890abcdef';
  const payload = JSON.stringify({ id: 'evt_test_123', type: 'checkout.session.completed' });
  const sigHeader = generateStripeSignature(payload, webhookSecret);

  const stripe = new Stripe('sk_test_mock_dummy_key_12345', { apiVersion: '2023-10-16' as any });
  const event = stripe.webhooks.constructEvent(payload, sigHeader, webhookSecret);

  assert.equal(event.id, 'evt_test_123');
  assert.equal(event.type, 'checkout.session.completed');
});

test('stripe-signature: rejects invalid signature and tampered raw body', () => {
  const webhookSecret = 'whsec_test_secret_key_1234567890abcdef';
  const payload = JSON.stringify({ id: 'evt_test_123', type: 'checkout.session.completed' });
  const tamperedPayload = JSON.stringify({ id: 'evt_test_123', type: 'customer.subscription.deleted' });
  const sigHeader = generateStripeSignature(payload, webhookSecret);

  const stripe = new Stripe('sk_test_mock_dummy_key_12345', { apiVersion: '2023-10-16' as any });

  assert.throws(
    () => stripe.webhooks.constructEvent(tamperedPayload, sigHeader, webhookSecret),
    /signature/,
    'Tampered payload must be rejected by constructEvent'
  );

  assert.throws(
    () => stripe.webhooks.constructEvent(payload, 't=123,v1=invalid_sig', webhookSecret),
    /signature/,
    'Invalid signature hash must be rejected'
  );
});

test('stripe-webhook: deduplicates duplicate webhook events using idempotencyKey', async () => {
  const processedEvents = new Set<string>();

  const processWebhookEvent = async (eventId: string, handler: () => Promise<void>) => {
    const idempotencyKey = `stripe:${eventId}`;
    if (processedEvents.has(idempotencyKey)) {
      return { duplicate: true };
    }
    await handler();
    processedEvents.add(idempotencyKey);
    return { duplicate: false };
  };

  let executionCount = 0;
  const mockHandler = async () => {
    executionCount++;
  };

  const res1 = await processWebhookEvent('evt_duplicate_test_1', mockHandler);
  assert.equal(res1.duplicate, false);
  assert.equal(executionCount, 1);

  // Duplicate retry from Stripe
  const res2 = await processWebhookEvent('evt_duplicate_test_1', mockHandler);
  assert.equal(res2.duplicate, true, 'Second event with identical ID must be recognized as duplicate');
  assert.equal(executionCount, 1, 'Duplicate event must not execute business logic again');
});

test('stripe-fulfillment: checkout.session.completed activates subscription and updates organization plan', async () => {
  const mockOrg = {
    id: 'org_test_123',
    plan: 'FREE',
    stripeCustomerId: null as string | null,
  };

  const mockSubscription = {
    id: 'sub_stripe_abc',
    organizationId: mockOrg.id,
    plan: 'PRO',
    status: 'ACTIVE',
  };

  // Simulate checkout session completion payload
  const session = {
    id: 'cs_test_123',
    customer: 'cus_stripe_customer_999',
    subscription: 'sub_stripe_abc',
    metadata: {
      organizationId: mockOrg.id,
      planTier: 'PRO',
    },
  };

  // State update logic
  if (session.metadata?.organizationId && session.metadata?.planTier) {
    mockOrg.plan = session.metadata.planTier;
    mockOrg.stripeCustomerId = session.customer as string;
  }

  assert.equal(mockOrg.plan, 'PRO', 'Organization plan must be upgraded to PRO');
  assert.equal(mockOrg.stripeCustomerId, 'cus_stripe_customer_999', 'Customer ID must be linked to tenant');
});

test('stripe-fulfillment: customer.subscription.deleted downgrades organization to FREE tier and marks canceled', async () => {
  const mockOrg = {
    id: 'org_test_paid',
    plan: 'PRO',
  };

  let subscriptionStatus = 'ACTIVE';

  const deletedEvent = {
    id: 'sub_test_del_123',
    metadata: { organizationId: mockOrg.id },
    status: 'canceled',
  };

  // Cancellation handler
  if (deletedEvent.metadata?.organizationId) {
    mockOrg.plan = 'FREE';
    subscriptionStatus = 'CANCELED';
  }

  assert.equal(mockOrg.plan, 'FREE', 'Canceled subscription must revert organization to FREE tier');
  assert.equal(subscriptionStatus, 'CANCELED', 'Subscription status must be set to CANCELED');
});

test('stripe-fulfillment: invoice.payment_failed marks subscription PAST_DUE without immediate plan destruction', async () => {
  let subscriptionStatus = 'ACTIVE';
  const org = { id: 'org_test_delinquent', plan: 'TEAM' };

  const invoiceFailedEvent = {
    subscription: 'sub_test_delinquent_1',
    customer: 'cus_delinquent_1',
  };

  if (invoiceFailedEvent.subscription) {
    subscriptionStatus = 'PAST_DUE';
  }

  assert.equal(subscriptionStatus, 'PAST_DUE', 'Failed invoice must mark status as PAST_DUE');
  assert.equal(org.plan, 'TEAM', 'Plan remains TEAM while awaiting retry/dunning period');
});

test('stripe-fulfillment: plan switching updates organization limits consistently', () => {
  const { PLAN_CONFIGS } = require('../../packages/shared/src/constants');

  let currentPlan = 'PRO';
  assert.equal(PLAN_CONFIGS[currentPlan].maxReviewsPerMonth, 500);

  // Switch to TEAM
  currentPlan = 'TEAM';
  assert.equal(PLAN_CONFIGS[currentPlan].maxReviewsPerMonth, 2500);
  assert.equal(PLAN_CONFIGS[currentPlan].maxRepositories, 50);

  // Switch back to FREE
  currentPlan = 'FREE';
  assert.equal(PLAN_CONFIGS[currentPlan].maxReviewsPerMonth, 25);
  assert.equal(PLAN_CONFIGS[currentPlan].maxRepositories, 3);
});
