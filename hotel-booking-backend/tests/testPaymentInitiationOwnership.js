// Regression test for payment initiation ownership/guest-phone enforcement.
// Run with: npm run test:payment-ownership

const assert = require('assert');
const { canInitiatePaymentForBooking } = require('../routes/payments');

const booking = {
  _id: 'booking-123',
  guestPhone: '+251911223344',
};

assert.strictEqual(
  canInitiatePaymentForBooking(booking, '+251911223344'),
  true,
  'Expected matching guest phone to allow payment initiation'
);

assert.strictEqual(
  canInitiatePaymentForBooking(booking, '+251900000000'),
  false,
  'Expected mismatched guest phone to block payment initiation'
);

assert.strictEqual(
  canInitiatePaymentForBooking(booking, null),
  false,
  'Expected missing guest phone to block payment initiation'
);

console.log('✅ Payment initiation ownership test passed');