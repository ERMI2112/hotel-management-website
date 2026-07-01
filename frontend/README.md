# StaySync Frontend

React + Vite frontend for the Hotel/Guesthouse Booking System.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure the API URL:

```bash
copy .env.example .env
```

Set `VITE_API_URL` to your backend URL. For local development, the default is:

```bash
VITE_API_URL=http://localhost:5000
```

3. Start the app:

```bash
npm run dev
```

## Pages

- Login
- Dashboard
- Room management
- Booking calendar
- Bookings list
- Public booking form

## Notes

- Auth tokens are stored in `localStorage` under `hotel_token`.
- Public booking uses the backend route `POST /api/bookings`.
- Booking invoice downloads are served from `GET /api/bookings/:id/invoice`.
- The frontend expects the backend seed account `admin@hotel.com` / `admin123` unless you change the seed data.

## Production build

```bash
npm run build
```
