# Hotel Booking System - Backend

Backend API for the Hotel/Guesthouse Booking System built with Express, MongoDB, and Node.js.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Start MongoDB:**
   - Local: Ensure MongoDB is running on localhost:27017
   - Cloud: Use MongoDB Atlas connection string

4. **Run the server:**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

All authenticated routes require `Authorization: Bearer <JWT>` header.

### Auth
- `POST /api/auth/login` - Login (public)

### Rooms
- `GET /api/rooms` - List all rooms (auth: owner/staff)
- `POST /api/rooms` - Create room (auth: owner)
- `PATCH /api/rooms/:id` - Update room (auth: owner)

### Bookings
- `GET /api/bookings` - List bookings with optional date filter (auth: owner/staff)
- `POST /api/bookings` - Create booking (public - triggers Telegram alert)
- `PATCH /api/bookings/:id/cancel` - Cancel booking (auth: owner/staff)
- `GET /api/bookings/:id/invoice` - Get PDF invoice (auth: owner/staff)

### Payments (Chapa Integration)
- `POST /api/payments/bookings/:id/initiate-payment` - Initialize payment (auth: owner/staff)
- `POST /api/payments/webhook` - Receive Chapa webhook callbacks (public, signature-verified)
- `GET /api/payments/verify/:txRef` - Verify payment status (auth: owner/staff)

## Default Admin Account

Create your first admin user by running the seed script or use MongoDB Compass/CLI to insert:

```js
{
  name: "Admin",
  email: "admin@hotel.com",
  passwordHash: "<bcrypt hash of your password>",
  role: "owner",
  phone: "+251900000000",
  createdAt: new Date()
}
```

Set `ADMIN_SEED_PASSWORD` in `.env` before running the seed script.

## Telegram Bot Setup

1. Message @BotFather on Telegram
2. Create a new bot with `/newbot`
3. Copy the bot token to `TELEGRAM_BOT_TOKEN` in .env
4. Get your chat ID by messaging @userinfobot
5. Copy your chat ID to `OWNER_CHAT_ID` in .env

## Chapa Payment Setup

1. Sign up at https://dashboard.chapa.co
2. Get your API keys (use test mode for development)
3. Add `CHAPA_SECRET_KEY` to .env
4. Set up webhook at Settings → Webhooks
5. Add webhook URL: `https://your-backend/api/payments/webhook`
6. Create webhook secret and add to `CHAPA_WEBHOOK_SECRET` in .env

**See `CHAPA_INTEGRATION_GUIDE.md` for detailed setup instructions.**

## Tech Stack

- Express.js - Web framework
- MongoDB + Mongoose - Database
- JWT + bcrypt - Authentication
- node-telegram-bot-api - Notifications
- pdfkit - Invoice generation
- express-validator - Input validation
- axios - HTTP client for Chapa API
- Chapa - Payment gateway integration
