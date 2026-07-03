const express = require('express');
const Booking = require('../models/Booking');
const { authenticate, authorize } = require('../middleware/auth');
const { initializePayment, verifyPayment, verifyWebhookSignature } = require('../services/chapa');
const { notifyPaymentReceived } = require('../services/telegram');

const router = express.Router();

const canInitiatePaymentForBooking = (booking, guestPhone) => {
  if (!booking || !guestPhone) {
    return false;
  }

  const normalizedGuestPhone = String(guestPhone).trim();
  const normalizedBookingPhone = String(booking.guestPhone || '').trim();

  return normalizedGuestPhone === normalizedBookingPhone;
};

// POST /api/payments/bookings/:id/initiate-payment - Initialize Chapa payment (Public for guests)
router.post('/bookings/:id/initiate-payment', async (req, res) => {
  try {
    const { id } = req.params;

    // Find the booking
    const booking = await Booking.findById(id).populate('room');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if payment is already completed
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Payment already completed for this booking' });
    }

    // Check if booking is cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot pay for cancelled booking' });
    }

    // Generate unique transaction reference
    const txRef = `booking-${booking._id}-${Date.now()}`;

    // Persist the reference before calling Chapa so a fast webhook can still resolve the booking
    booking.chapaReference = txRef;
    await booking.save();

    // Prepare payment data (omit phoneNumber to let Chapa handle selection cleanly on their hosted page)
    const paymentData = {
      amount: booking.totalPrice,
      email: req.body.email || `booking-${booking._id}@staysync.com`,
      firstName: booking.guestName.split(' ')[0] || 'Guest',
      lastName: booking.guestName.split(' ').slice(1).join(' ') || 'User',
      txRef: txRef,
      callbackUrl: `${req.protocol}://${req.get('host')}/api/payments/webhook`,
      returnUrl: req.body.returnUrl || `${req.protocol}://${req.get('host')}/bookings/${booking._id}`,
      customization: {
        title: 'StaySync',
        description: `Room ${booking.room.roomNumber} - ${booking.guestName}`
      }
    };

    // Initialize payment with Chapa
    const chapaResponse = await initializePayment(paymentData);

    console.log('✅ Payment initialized:', {
      bookingId: booking._id,
      txRef: txRef,
      amount: booking.totalPrice,
      checkoutUrl: chapaResponse.data?.checkout_url
    });

    // Return checkout URL to frontend
    res.json({
      message: 'Payment initialized successfully',
      checkoutUrl: chapaResponse.data?.checkout_url,
      txRef: txRef,
      bookingId: booking._id
    });
  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({ error: error.message || 'Failed to initialize payment' });
  }
});

// POST /api/payments/webhook - Receive Chapa webhook callbacks
const handleWebhook = async (req, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body ?? '');
    const signature = req.headers['x-chapa-signature'];
    const legacySignature = req.headers['chapa-signature'];

    if (!rawBody) {
      console.error('❌ Empty webhook body');
      return res.status(400).json({ error: 'Empty webhook body' });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('❌ Invalid webhook JSON payload:', parseError.message);
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    console.log('📨 Webhook received:', {
      event: payload.event,
      txRef: payload.tx_ref,
      status: payload.status,
      type: payload.type
    });

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, legacySignature);
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if this is a transaction webhook (not transfer)
    if (payload.type === 'Payout') {
      console.log('ℹ️  Ignoring payout webhook');
      return res.status(200).send('OK');
    }

    // Extract transaction reference
    const txRef = payload.tx_ref || payload.reference;
    if (!txRef) {
      console.error('❌ No transaction reference in webhook');
      return res.status(400).json({ error: 'Missing transaction reference' });
    }

    // Find booking by Chapa reference (populate room for notifications)
    const booking = await Booking.findOne({ chapaReference: txRef }).populate('room');
    if (!booking) {
      console.error('❌ Booking not found for txRef:', txRef);
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Handle different events
    switch (payload.event) {
      case 'charge.success':
        // Webhook signature is already verified, trust the payload directly
        const wasPaidWebhook = booking.paymentStatus === 'paid';
        booking.paymentStatus = 'paid';
        await booking.save();
        
        console.log('✅ Payment confirmed via webhook:', {
          bookingId: booking._id,
          txRef: txRef,
          amount: booking.totalPrice
        });

        if (!wasPaidWebhook && booking.room) {
          await notifyPaymentReceived(booking, booking.room);
        }
        break;

      case 'charge.failed':
      case 'charge.cancelled':
        booking.paymentStatus = 'failed';
        await booking.save();
        
        console.log('❌ Payment failed/cancelled:', {
          bookingId: booking._id,
          txRef: txRef
        });
        break;

      case 'charge.refunding':
      case 'charge.refunded':
        // Handle refund if needed
        console.log('💰 Refund processed:', {
          bookingId: booking._id,
          txRef: txRef
        });
        break;

      default:
        console.log('ℹ️  Unhandled event:', payload.event);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent retries for unrecoverable errors
    res.status(200).send('OK');
  }
};

// GET /api/payments/verify/:txRef - Manually verify a payment (Public for frontend check)
router.get('/verify/:txRef', async (req, res) => {
  try {
    const { txRef } = req.params;

    // Verify with Chapa
    const verification = await verifyPayment(txRef);

    // Find and update booking (populate room for notifications)
    const booking = await Booking.findOne({ chapaReference: txRef }).populate('room');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (verification.status === 'success' && verification.data?.status === 'success') {
      const wasPaidVerify = booking.paymentStatus === 'paid';
      booking.paymentStatus = 'paid';
      await booking.save();

      if (!wasPaidVerify && booking.room) {
        await notifyPaymentReceived(booking, booking.room);
      }
    }

    res.json({
      message: 'Payment verified',
      paymentStatus: booking.paymentStatus,
      verificationData: verification.data
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

module.exports = router;
module.exports.handleWebhook = handleWebhook;
module.exports.canInitiatePaymentForBooking = canInitiatePaymentForBooking;
