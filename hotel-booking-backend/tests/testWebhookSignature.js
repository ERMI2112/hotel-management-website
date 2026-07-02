// Test webhook signature generation
// Run with: node tests/testWebhookSignature.js

require('dotenv').config();
const crypto = require('crypto');

// Sample webhook payload from Chapa
const samplePayload = {
  event: 'charge.success',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  mobile: '0911223344',
  currency: 'ETB',
  amount: '2400.00',
  charge: '72.00',
  status: 'success',
  mode: 'test',
  reference: 'APqDvYw1okk2',
  created_at: '2026-07-02T10:30:00.000000Z',
  updated_at: '2026-07-02T10:30:10.000000Z',
  type: 'API',
  tx_ref: 'booking-66a7b8c9d0e1f2a3b4c5d6e7-1720000000000',
  payment_method: 'telebirr'
};

const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error('❌ CHAPA_WEBHOOK_SECRET not set in .env');
  process.exit(1);
}

// Generate signature
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(samplePayload))
  .digest('hex');

console.log('='.repeat(60));
console.log('CHAPA WEBHOOK SIGNATURE TEST');
console.log('='.repeat(60));
console.log('\nWebhook Secret:', webhookSecret);
console.log('\nSample Payload:');
console.log(JSON.stringify(samplePayload, null, 2));
console.log('\nGenerated Signature (x-chapa-signature):');
console.log(signature);
console.log('\n' + '='.repeat(60));
console.log('HOW TO TEST:');
console.log('='.repeat(60));
console.log('\n1. Copy the signature above');
console.log('2. Use it in the x-chapa-signature header when testing webhook');
console.log('3. Or use this curl command:\n');
console.log(`curl -X POST http://localhost:5000/api/payments/webhook \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "x-chapa-signature: ${signature}" \\`);
console.log(`  -d '${JSON.stringify(samplePayload)}'`);
console.log('\n' + '='.repeat(60));
