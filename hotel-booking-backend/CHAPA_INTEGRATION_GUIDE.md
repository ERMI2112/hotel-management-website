# Chapa Payment Gateway Integration Guide

## Overview

Chapa is an Ethiopian payment gateway that supports various payment methods including mobile money, bank transfers, and card payments. This integration allows guests to pay for hotel bookings securely.

---

## Setup Instructions

### 1. Get Chapa API Credentials

1. **Sign up at Chapa:**
   - Go to https://dashboard.chapa.co
   - Create an account
   - Complete business verification

2. **Get your API keys:**
   - Navigate to Settings → API Keys
   - Copy your **Secret Key** (starts with `CHASECK-`)
   - For testing, toggle to **Test Mode** and use test keys

3. **Set up webhook:**
   - Go to Settings → Webhooks
   - Add webhook URL: `https://your-backend-url.com/api/payments/webhook`
   - Set a **Webhook Secret** (any random string)
   - Save your webhook secret

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Chapa Payment Gateway
CHAPA_SECRET_KEY=CHASECK-test-xxxxxxxxxxxxxx  # From dashboard
CHAPA_WEBHOOK_SECRET=your-random-webhook-secret  # From webhook settings
BACKEND_URL=http://localhost:5000  # Or your production URL
```

### 3. Install Dependencies

```bash
npm install
```

---

## Payment Flow

### Step 1: Create a Booking

Guest creates a booking (existing endpoint):

```bash
POST /api/bookings
{
  "roomId": "room-id-here",
  "guestName": "John Doe",
  "guestPhone": "+251911223344",
  "checkIn": "2026-07-10",
  "checkOut": "2026-07-12"
}
```

Response includes `paymentStatus: "pending"`

### Step 2: Initialize Payment

Admin/Staff initiates payment for the booking:

```bash
POST /api/payments/bookings/:bookingId/initiate-payment
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "email": "guest@example.com",  # Optional, will generate fallback
  "returnUrl": "https://your-frontend.com/booking-confirmation"
}
```

**Response:**
```json
{
  "message": "Payment initialized successfully",
  "checkoutUrl": "https://checkout.chapa.co/checkout/web/payment/...",
  "txRef": "booking-66a7b8c9d0e1f2a3b4c5d6e7-1720000000000",
  "bookingId": "66a7b8c9d0e1f2a3b4c5d6e7"
}
```

### Step 3: Redirect to Chapa

Frontend redirects the guest to `checkoutUrl` where they complete payment.

### Step 4: Payment Completion

After payment:
1. **Chapa webhook** calls your backend → updates `paymentStatus` to `"paid"`
2. **Guest is redirected** to your `returnUrl`
3. **Email notification** is sent by Chapa (optional)

### Step 5: Verify Payment (Optional)

Frontend can verify payment status:

```bash
GET /api/payments/verify/:txRef
Authorization: Bearer <jwt-token>
```

---

## API Endpoints

### POST `/api/payments/bookings/:id/initiate-payment`

**Auth:** Required (owner/staff)

**Purpose:** Initialize Chapa payment for a booking

**Request Body:**
```json
{
  "email": "guest@example.com",  // Optional
  "returnUrl": "https://frontend.com/success"  // Optional
}
```

**Response:**
```json
{
  "message": "Payment initialized successfully",
  "checkoutUrl": "https://checkout.chapa.co/...",
  "txRef": "booking-xxx-timestamp",
  "bookingId": "booking-id"
}
```

---

### POST `/api/payments/webhook`

**Auth:** None (verified via signature)

**Purpose:** Receive payment status updates from Chapa

**Handled Events:**
- `charge.success` → Payment successful → `paymentStatus = "paid"`
- `charge.failed` → Payment failed → `paymentStatus = "failed"`
- `charge.cancelled` → Payment cancelled → `paymentStatus = "failed"`
- `charge.refunding` / `charge.refunded` → Refund processed

**Webhook Payload Example:**
```json
{
  "event": "charge.success",
  "tx_ref": "booking-xxx-timestamp",
  "status": "success",
  "amount": "2400.00",
  "currency": "ETB",
  "payment_method": "telebirr",
  "mobile": "0911223344"
}
```

**Security:**
- Verifies `x-chapa-signature` or `chapa-signature` header
- Uses HMAC SHA256 with webhook secret
- Always returns `200 OK` to prevent retries

---

### GET `/api/payments/verify/:txRef`

**Auth:** Required (owner/staff)

**Purpose:** Manually verify payment status

**Response:**
```json
{
  "message": "Payment verified",
  "paymentStatus": "paid",
  "verificationData": {
    "status": "success",
    "amount": 2400,
    "currency": "ETB",
    "tx_ref": "booking-xxx-timestamp"
  }
}
```

---

## Booking Model Changes

Added fields to `Booking` model:

```javascript
{
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  chapaReference: {
    type: String,  // Stores tx_ref for tracking
    sparse: true
  }
}
```

---

## Testing with Chapa Test Mode

### Enable Test Mode

1. Go to Chapa dashboard → Settings
2. Toggle **Test Mode** to ON
3. Use test secret key in `.env`

### Test Card Numbers

Use these test cards on Chapa checkout:

**Success:**
- Card: `4200 0000 0000 0000`
- CVV: Any 3 digits
- Expiry: Any future date

**Failed:**
- Card: `4100 0000 0000 0000`
- CVV: Any 3 digits
- Expiry: Any future date

### Test Mobile Numbers

For Telebirr/M-Pesa testing:
- Use any Ethiopian mobile number format
- Test mode will simulate payment flow
- Check dashboard for transaction logs

### Webhook Testing

Use **ngrok** or **localhost tunneling** for local development:

```bash
# Install ngrok
npm install -g ngrok

# Tunnel to your local backend
ngrok http 5000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Set webhook URL in Chapa dashboard:
# https://abc123.ngrok.io/api/payments/webhook
```

---

## Frontend Integration (For Antigravity)

### Display Payment Button

After booking is created:

```javascript
// In booking confirmation page
const handlePayment = async () => {
  try {
    const response = await axios.post(
      `/api/payments/bookings/${bookingId}/initiate-payment`,
      {
        email: guestEmail,
        returnUrl: window.location.origin + '/payment-success'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Redirect to Chapa checkout
    window.location.href = response.data.checkoutUrl;
  } catch (error) {
    console.error('Payment error:', error);
  }
};
```

### Handle Payment Return

On return URL page:

```javascript
// Extract txRef from URL params
const urlParams = new URLSearchParams(window.location.search);
const txRef = urlParams.get('trx_ref');
const status = urlParams.get('status');

// Verify payment
if (txRef && status === 'success') {
  const verification = await axios.get(
    `/api/payments/verify/${txRef}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  if (verification.data.paymentStatus === 'paid') {
    // Show success message
  }
}
```

### Display Payment Status

```javascript
// In booking list/details
<Badge color={booking.paymentStatus === 'paid' ? 'green' : 'yellow'}>
  {booking.paymentStatus}
</Badge>
```

---

## Security Best Practices

### 1. Never Hardcode Keys

✅ **DO:**
```javascript
const secretKey = process.env.CHAPA_SECRET_KEY;
```

❌ **DON'T:**
```javascript
const secretKey = 'CHASECK-xxxxx'; // Never commit this!
```

### 2. Always Verify Webhooks

The webhook handler already verifies signatures:

```javascript
const isValid = verifyWebhookSignature(payload, signature, legacySignature);
if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### 3. Double-Verify Critical Transactions

Before marking payment as complete, the webhook calls `verifyPayment()` to confirm with Chapa's API.

### 4. Use HTTPS in Production

- Backend URL must be HTTPS for webhooks
- Frontend return URL should be HTTPS

---

## Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook URL is accessible:**
   ```bash
   curl -X POST https://your-backend.com/api/payments/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

2. **Verify webhook secret matches:**
   - Check Chapa dashboard webhook settings
   - Ensure `CHAPA_WEBHOOK_SECRET` in `.env` matches

3. **Check server logs:**
   ```bash
   npm run dev
   # Look for "📨 Webhook received:" logs
   ```

### Payment Not Marking as Paid

1. **Check webhook received:**
   - Look for webhook logs in console
   - Verify signature validation passed

2. **Check booking exists:**
   - Ensure `chapaReference` was saved
   - Verify `txRef` matches

3. **Manually verify:**
   ```bash
   GET /api/payments/verify/booking-xxx-timestamp
   ```

### "CHAPA_SECRET_KEY is not configured" Error

1. Check `.env` file has `CHAPA_SECRET_KEY`
2. Restart server after adding env var
3. Verify key format: `CHASECK-test-xxxxx` or `CHASECK-live-xxxxx`

---

## Monitoring & Logs

### Console Logs

The integration logs all payment activities:

```
✅ Payment initialized: { bookingId, txRef, amount, checkoutUrl }
📨 Webhook received: { event, txRef, status, type }
✅ Payment confirmed: { bookingId, txRef, amount }
❌ Payment failed/cancelled: { bookingId, txRef }
💰 Refund processed: { bookingId, txRef }
```

### Chapa Dashboard

Monitor transactions at https://dashboard.chapa.co:
- Transaction history
- Webhook delivery logs
- Failed attempts
- Refund requests

---

## Production Checklist

Before going live:

- [ ] Switch to **Live Mode** in Chapa dashboard
- [ ] Replace test secret key with **live secret key**
- [ ] Update webhook URL to production backend
- [ ] Enable HTTPS on backend and frontend
- [ ] Test webhook delivery with real transactions
- [ ] Set up email notifications in Chapa
- [ ] Configure refund policies
- [ ] Monitor first few transactions closely

---

## Cost & Fees

Chapa charges transaction fees:
- **Telebirr:** 3% + 0 ETB
- **M-Pesa:** 3% + 0 ETB
- **Bank transfer:** Varies by bank
- **Cards:** 3.5% + 0 ETB

Fees are automatically deducted before payout.

---

## Support

- **Chapa Docs:** https://developer.chapa.co
- **Chapa Support:** support@chapa.co
- **Telegram:** https://t.me/chapist_dev
- **Dashboard:** https://dashboard.chapa.co

---

## Summary

✅ **Payment flow:** Booking created → Initialize payment → Redirect to Chapa → Webhook updates status
✅ **Security:** Webhook signature verification + double verification with API
✅ **Test mode:** Use test cards and mobile numbers
✅ **Monitoring:** Console logs + Chapa dashboard
✅ **Production ready:** Just switch to live keys

Payment integration is complete and ready for testing!
