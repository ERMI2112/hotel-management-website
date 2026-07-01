# Hotel Booking System - Build Checklist

## Phase 1: Backend Setup (Kiro) ✅

- [x] Project structure created
- [x] All 3 models (User, Room, Booking) implemented
- [x] All 8 API routes implemented
- [x] JWT authentication + role-based access
- [x] Telegram bot integration code ready
- [x] PDF invoice generation
- [x] Input validation middleware
- [ ] **YOU DO NOW:** Local setup
  - [ ] Run `npm install`
  - [ ] Create `.env` from `.env.example`
  - [ ] Add MongoDB URI (local or Atlas)
  - [ ] Add JWT secret (any random string)
  - [ ] Run `npm run seed` to create admin user
  - [ ] Run `npm run dev` - server should start

---

## Phase 2: Telegram Bot Setup (5 min)

- [ ] **Step 1:** Open Telegram, search `@BotFather`
- [ ] **Step 2:** Send `/newbot` command
- [ ] **Step 3:** Choose bot name (e.g., "My Hotel Bot")
- [ ] **Step 4:** Choose username (must end in `bot`, e.g., `myhotel_bot`)
- [ ] **Step 5:** Copy the token BotFather gives you
- [ ] **Step 6:** Search `@userinfobot` in Telegram
- [ ] **Step 7:** Copy your chat ID number
- [ ] **Step 8:** Add both to `.env`:
  ```
  TELEGRAM_BOT_TOKEN=paste-token-here
  OWNER_CHAT_ID=paste-chat-id-here
  ```
- [ ] **Step 9:** Restart backend (`npm run dev`)
- [ ] **Step 10:** Test by creating a booking - you should get Telegram message!

---

## Phase 3: Frontend (Antigravity)

*Paste these sections to Antigravity:*

### What to Build:
- [ ] Login page (email/password)
- [ ] Room management table (owner only)
- [ ] Booking calendar (color-coded by status)
- [ ] Public booking form (no auth required)
- [ ] Admin dashboard

### API Base URL:
```
Local: http://localhost:5000
Production: https://your-render-url.onrender.com
```

### Tech Stack:
- React + Vite
- Tailwind CSS + shadcn/ui
- react-big-calendar or FullCalendar
- Axios for API calls

### Pages Needed:
1. `/login` - Admin login
2. `/dashboard` - Admin home (stats)
3. `/rooms` - Room management table
4. `/bookings` - Calendar view
5. `/book` - Public booking form (no auth)

---

## Phase 4: Integration (Cursor)

*After both backend + frontend exist:*

- [ ] Connect frontend API calls to backend
- [ ] Set `VITE_API_URL` in frontend `.env`
- [ ] Fix CORS issues if any
- [ ] Test full flow:
  - [ ] Admin can login
  - [ ] Admin can create rooms
  - [ ] Guest can submit booking
  - [ ] Telegram message arrives
  - [ ] Admin can view bookings
  - [ ] Admin can download invoice PDF

---

## Phase 5: Deployment

### Backend to Render:
- [ ] Create GitHub repo
- [ ] Push backend code
- [ ] Sign up at render.com
- [ ] Create "Web Service" from GitHub
- [ ] Set environment variables:
  - [ ] `MONGODB_URI` (use Atlas)
  - [ ] `TELEGRAM_BOT_TOKEN`
  - [ ] `OWNER_CHAT_ID`
  - [ ] `JWT_SECRET` (auto-generated)
- [ ] Copy the Render URL (e.g., `https://...onrender.com`)

### Frontend to Vercel:
- [ ] Set `VITE_API_URL` to Render backend URL
- [ ] Run `vercel` in frontend directory
- [ ] Copy the Vercel URL (e.g., `https://...vercel.app`)

### Final Config:
- [ ] Update backend's `FRONTEND_URL` on Render to Vercel URL
- [ ] Test production: login, create booking, check Telegram

---

## Demo Features (For Clients)

✅ **What Makes This Special:**
1. **Telegram Notifications** - Instant alerts to owner's phone
2. **Visual Calendar** - See occupancy at a glance
3. **PDF Invoices** - Professional receipts
4. **Role-Based Access** - Owner vs Staff permissions
5. **Public Booking** - No login required for guests
6. **Modern UI** - Clean, mobile-friendly interface

---

## Current Status

- ✅ Backend complete (Kiro)
- ⏳ Local setup + Telegram (YOU - 10 min)
- ⏳ Frontend build (Antigravity - pass them the spec)
- ⏳ Integration (Cursor - after both exist)
- ⏳ Deployment (follow DEPLOYMENT.md)

**Next immediate step:** Complete Phase 2 (Telegram setup) - it's your best demo feature!
