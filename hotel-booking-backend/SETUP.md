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
   - `TELEGRAM_BOT_TOKEN` (optional, from @BotFather)
   - `OWNER_CHAT_ID` (optional, from @userinfobot)

3. **Create admin user:**
   ```bash
   npm run seed
   ```
   Default credentials: `admin@hotel.com` / `admin123`

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
  -d "{\"email\":\"admin@hotel.com\",\"password\":\"admin123\"}"

# List rooms (requires token)
curl http://localhost:5000/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## For Antigravity & Cursor

The backend will be running on `http://localhost:5000`

Set `VITE_API_URL=http://localhost:5000` in the frontend `.env` file.

All API routes are documented in README.md
