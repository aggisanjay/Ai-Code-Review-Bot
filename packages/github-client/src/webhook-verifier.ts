import * as crypto from 'node:crypto';

export interface VerifyWebhookSignatureOptions {
  payload: string | Buffer;
  signatureHeader?: string;
  secret: string;
}

export function verifyWebhookSignature({
  payload,
  signatureHeader,
  secret,
}: VerifyWebhookSignatureOptions): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  // GitHub sends signatures formatted as 'sha256=<hex_digest>'
  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const signatureHex = parts[1];
  const payloadBuffer = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadBuffer);
  const expectedSignatureHex = hmac.digest('hex');

  const signatureBuffer = Buffer.from(signatureHex, 'hex');
  const expectedBuffer = Buffer.from(expectedSignatureHex, 'hex');

  // Verify byte lengths match before timingSafeEqual to avoid range errors
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}
