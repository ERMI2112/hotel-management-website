# Chapa Payment - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Get Credentials (2 min)

```bash
# Visit: https://dashboard.chapa.co
# Sign up → Toggle Test Mode → Copy API Keys
```

### 2. Configure (1 min)

```bash
# Edit hotel-booking-backend/.env
CHAPA_SECRET_KEY=CHASECK-test-xxxxxxxxxxxxx
CHAPA_WEBHOOK_SECRET=my-random-secret-123
BACKEND_URL=http://localhost:5000
```

### 3. Install & Start (2 min)

```bash
cd hotel-booking-backend
npm install
npm run dev
```

✅ **Done!** Payment integration is active.

---

## 🧪 Quick Test

### Option A: Manual Test via API

```bash
# 1. Login
POST http://localhost:5000/api/auth/login
{
  "email": "admin@hotel.com",
  "password": "admin123"
}

# 2. Create booking
POST http://localhost:5000/api/bookings
{
  "roomId": "YOUR_ROOM_ID",
  "guestName": "Test User",
  "guestPhone": "+251911223344",
  "checkIn": "2026-07-15",
  "checkOut": "2026-07-17"
}

# 3. Initialize payment
POST http://localhost:5000/api/payments/bookings/{bookingId}/initiate-payment
Authorization: Bearer YOUR_TOKEN
{
  "email": "test@example.com"
}

# 4. Open checkoutUrl in browser, use test card:
# Card: 4200 0000 0000 0000
# CVV: 123
# Expiry: 12/28
```

### Option B: Use Test Files

```bash
# See detailed tests in:
hotel-booking-backend/tests/testChapaIntegration.http

# Generate webhook signature:
node hotel-booking-backend/tests/testWebhookSignature.js
```

---

## 📊 Payment Status Flow

```
Booking Created
    ↓
paymentStatus: "pending"
    ↓
Admin initiates payment
    ↓
Guest pays on Chapa
    ↓
Webhook received
    ↓
paymentStatus: "paid" ✓
```

---

## 🔑 Test Cards

| Card Number | Result |
|---|---|
| 4200 0000 0000 0000 | ✅ Success |
| 4100 0000 0000 0000 | ❌ Failed |

---

## 📝 Key Files

| File | Purpose |
|---|---|
| `routes/payments.js` | Payment endpoints |
| `services/chapa.js` | Chapa API client |
| `models/Booking.js` | Added paymentStatus field |
| `CHAPA_INTEGRATION_GUIDE.md` | Full documentation |

---

## 🌐 Webhook Setup (For Production)

```bash
# 1. Use ngrok for local testing
ngrok http 5000

# 2. Copy https URL
# 3. Add to Chapa dashboard:
# Settings → Webhooks → Add URL
# https://your-ngrok-url.ngrok.io/api/payments/webhook

# 4. Set webhook secret in dashboard
# 5. Add same secret to .env:
CHAPA_WEBHOOK_SECRET=your-secret-from-dashboard
```

---

## ✅ Verification Checklist

- [ ] `CHAPA_SECRET_KEY` in `.env`
- [ ] `CHAPA_WEBHOOK_SECRET` in `.env`
- [ ] Backend running on `http://localhost:5000`
- [ ] Can initialize payment
- [ ] Checkout URL redirects to Chapa
- [ ] Test card payment succeeds
- [ ] `paymentStatus` updates to `"paid"`
- [ ] Webhook logs appear in console

---

## 🆘 Troubleshooting

### "CHAPA_SECRET_KEY is not configured"
→ Add to `.env` and restart server

### Payment stays "pending"
→ Check webhook URL is accessible
→ Verify webhook secret matches
→ Check console for webhook logs

### Checkout URL not working
→ Verify test mode is enabled in dashboard
→ Check Chapa secret key is valid

---

## 📚 Full Documentation

- **Complete Guide:** `CHAPA_INTEGRATION_GUIDE.md`
- **Summary:** `CHAPA_PAYMENT_SUMMARY.md`
- **API Tests:** `tests/testChapaIntegration.http`
- **Chapa Docs:** https://developer.chapa.co

---

## 🎯 Next Steps for Antigravity (Frontend)

```javascript
// Add payment button in booking page
const handlePayment = async (bookingId) => {
  const response = await axios.post(
    `/api/payments/bookings/${bookingId}/initiate-payment`,
    { email: guestEmail },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  window.location.href = response.data.checkoutUrl;
};

// Show payment status badge
<Badge color={booking.paymentStatus === 'paid' ? 'green' : 'yellow'}>
  {booking.paymentStatus}
</Badge>
```

---

**That's it!** Payment integration is ready. 🎉
