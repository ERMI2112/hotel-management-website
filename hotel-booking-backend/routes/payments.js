const express = require('express');
const Booking = require('../models/Booking');
const { authenticate, authorize } = require('../middleware/auth');
const { initializePayment, verifyPayment, verifyWebhookSignature } = require('../services/chapa');

const router = express.Router();

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

    // Prepare payment data
    const paymentData = {
      amount: booking.totalPrice,
      email: req.body.email || `${booking.guestPhone}@hotel.local`, // Fallback email if not provided
      firstName: booking.guestName.split(' ')[0] || 'Guest',
      lastName: booking.guestName.split(' ').slice(1).join(' ') || 'User',
      phoneNumber: booking.guestPhone.replace(/\D/g, '').slice(-10), // Last 10 digits only
      txRef: txRef,
      callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook`,
      returnUrl: req.body.returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/bookings/${booking._id}`,
      customization: {
        title: 'Hotel Booking Payment',
        description: `Payment for Room ${booking.room.roomNumber} - ${booking.guestName}`
      }
    };

    // Initialize payment with Chapa
    const chapaResponse = await initializePayment(paymentData);

    // Update booking with transaction reference
    booking.chapaReference = txRef;
    await booking.save();

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
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-chapa-signature'];
    const legacySignature = req.headers['chapa-signature'];

    console.log('📨 Webhook received:', {
      event: payload.event,
      txRef: payload.tx_ref,
      status: payload.status,
      type: payload.type
    });

    // Verify webhook signature
    const isValid = verifyWebhookSignature(payload, signature, legacySignature);
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

    // Find booking by Chapa reference
    const booking = await Booking.findOne({ chapaReference: txRef });
    if (!booking) {
      console.error('❌ Booking not found for txRef:', txRef);
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Handle different events
    switch (payload.event) {
      case 'charge.success':
        // Verify payment with Chapa API before marking as paid
        const verification = await verifyPayment(txRef);
        
        if (verification.status === 'success' && verification.data?.status === 'success') {
          booking.paymentStatus = 'paid';
          await booking.save();
          
          console.log('✅ Payment confirmed:', {
            bookingId: booking._id,
            txRef: txRef,
            amount: booking.totalPrice
          });
        } else {
          console.warn('⚠️  Payment verification failed:', verification);
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
});

// GET /api/payments/verify/:txRef - Manually verify a payment (Public for frontend check)
router.get('/verify/:txRef', async (req, res) => {
  try {
    const { txRef } = req.params;

    // Verify with Chapa
    const verification = await verifyPayment(txRef);

    // Find and update booking
    const booking = await Booking.findOne({ chapaReference: txRef });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (verification.status === 'success' && verification.data?.status === 'success') {
      booking.paymentStatus = 'paid';
      await booking.save();
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
