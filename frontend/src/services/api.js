const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('hotel_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { auth = true, ...options } = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(auth ? authHeaders() : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      body.error ||
      body.errors?.[0]?.msg ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

function normalizeId(doc) {
  if (!doc) return doc;
  const id = doc.id || doc._id?.toString?.() || String(doc._id);
  return { ...doc, id: String(id) };
}

function normalizeRoom(room) {
  return normalizeId(room);
}

function normalizeBooking(booking) {
  const roomObj = booking.room && typeof booking.room === 'object' ? booking.room : null;
  const roomId = roomObj ? roomObj._id || roomObj.id : booking.room;

  return {
    ...normalizeId(booking),
    room: String(roomId),
    roomDetails: roomObj ? normalizeRoom(roomObj) : booking.roomDetails,
  };
}

export async function login({ email, password }) {
  const result = await request('/api/auth/login', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return {
    token: result.token,
    user: normalizeId(result.user),
  };
}

export async function getRooms({ publicOnly = false } = {}) {
  const path = publicOnly ? '/api/rooms/public' : '/api/rooms';
  const auth = !publicOnly;
  const rooms = await request(path, { auth });
  return rooms.map(normalizeRoom);
}

export async function createRoom({ roomNumber, type, pricePerNight }) {
  const room = await request('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ roomNumber, type, pricePerNight: Number(pricePerNight) }),
  });
  return normalizeRoom(room);
}

export async function updateRoom(id, updates) {
  const room = await request(`/api/rooms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return normalizeRoom(room);
}

export async function getBookings(from, to) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  const bookings = await request(`/api/bookings${query ? `?${query}` : ''}`);
  return bookings.map(normalizeBooking);
}

export async function createBooking({ roomId, guestName, guestPhone, checkIn, checkOut }) {
  // HTML date inputs output YYYY-MM-DD. We append T12:00:00 to avoid
  // timezone-shift bugs where UTC midnight rolls back to the previous day
  // in negative-offset timezones (e.g. UTC-5).
  const toISO = (dateStr) => {
    if (!dateStr) return dateStr;
    // Already a full ISO string? pass through
    if (dateStr.includes('T')) return dateStr;
    // YYYY-MM-DD from <input type="date"> → safe noon UTC
    return `${dateStr}T12:00:00.000Z`;
  };

  const booking = await request('/api/bookings', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({
      roomId,
      guestName,
      guestPhone,
      checkIn: toISO(checkIn),
      checkOut: toISO(checkOut),
    }),
  });
  return normalizeBooking(booking);
}

export async function cancelBooking(id) {
  const booking = await request(`/api/bookings/${id}/cancel`, { method: 'PATCH' });
  return normalizeBooking(booking);
}

export async function downloadInvoice(id) {
  const res = await fetch(`${API_URL}/api/bookings/${id}/invoice`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to download invoice');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function getStats() {
  const [rooms, bookings] = await Promise.all([getRooms(), getBookings()]);
  const totalRooms = rooms.length;
  const occupied = rooms.filter((r) => r.status === 'occupied').length;
  const available = rooms.filter((r) => r.status === 'available').length;
  const maintenance = rooms.filter((r) => r.status === 'maintenance').length;
  const activeBookings = bookings.filter((b) => b.status === 'confirmed').length;
  const totalRevenue = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  return {
    totalRooms,
    occupied,
    available,
    maintenance,
    activeBookings,
    totalRevenue,
  };
}

export async function initiatePayment(bookingId, { email, guestPhone, returnUrl } = {}) {
  const result = await request(`/api/payments/bookings/${bookingId}/initiate-payment`, {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ email, guestPhone, returnUrl }),
  });
  return result;
}

export async function getPublicBooking(bookingId) {
  const booking = await request(`/api/bookings/public/${bookingId}`, {
    auth: false,
  });
  return normalizeBooking(booking);
}

export async function verifyPayment(txRef) {
  const result = await request(`/api/payments/verify/${txRef}`, {
    auth: false,
  });
  return result;
}
