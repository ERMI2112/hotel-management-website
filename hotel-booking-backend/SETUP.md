# Backend Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   cd hotel-booking-backend
   npm install
   ```

2. **Set up environment:**
   ```bash
   copy .env.example .env
   ```
   Edit `.env` and set:
   - `MONGODB_URI` (local or MongoDB Atlas)
   - `JWT_SECRET` (any random string)
   - `ADMIN_SEED_PASSWORD` (used by seed scripts)
   - `STAFF_SEED_PASSWORD` (used by seed scripts)
   - `TELEGRAM_BOT_TOKEN` (optional, from @BotFather)
   - `OWNER_CHAT_ID` (optional, from @userinfobot)

3. **Create admin user:**
   ```bash
   npm run seed
   ```
   The seed password comes from `ADMIN_SEED_PASSWORD`.

4. **Start the server:**
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:5000`

## API Testing

Test with curl or Postman:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
   -d "{\"email\":\"admin@hotel.com\",\"password\":\"<ADMIN_SEED_PASSWORD>\"}"

# List rooms (requires token)
curl http://localhost:5000/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## For Antigravity & Cursor

The backend will be running on `http://localhost:5000`

Set `VITE_API_URL=http://localhost:5000` in the frontend `.env` file.

All API routes are documented in README.md
