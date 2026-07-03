// Regression test for Chapa webhook signature verification using the raw request body.
// Run with: npm run test:webhook-raw

require('dotenv').config();
const assert = require('assert');
const crypto = require('crypto');
const { verifyWebhookSignature } = require('../services/chapa');

process.env.CHAPA_WEBHOOK_SECRET = process.env.CHAPA_WEBHOOK_SECRET || 'test-webhook-secret';

const rawBody = '{"event":"charge.success","tx_ref":"booking-123","status":"success"}';
const signature = crypto
  .createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET)
  .update(Buffer.from(rawBody, 'utf8'))
  .digest('hex');

assert.strictEqual(
  verifyWebhookSignature(rawBody, signature),
  true,
  'Expected raw-body signature verification to pass'
);

const parsedBody = JSON.parse(rawBody);
const reserializedBody = JSON.stringify(parsedBody, null, 2);

assert.strictEqual(
  verifyWebhookSignature(reserializedBody, signature),
  false,
  'Expected verification to fail when the body bytes differ'
);

console.log('✅ Raw-body webhook signature test passed');