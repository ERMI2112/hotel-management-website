import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hotel, CheckCircle, Loader2, User, Phone, CalendarDays, ArrowRight, CreditCard, AlertCircle, Star, Shield, Clock, Wifi, Coffee, MapPin } from 'lucide-react';
import { getRooms, createBooking, initiatePayment, getPublicBooking, verifyPayment, getBookedDatesForRoom } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

const roomImages = {
  single: '/images/room-single.png',
  double: '/images/room-double.png',
  suite: '/images/room-suite.png',
};

const roomLabels = {
  single: 'Standard Room',
  double: 'Double Room',
  suite: 'Premium Suite',
};

const roomDescriptions = {
  single: 'Cozy and modern — perfect for solo travelers seeking comfort and convenience.',
  double: 'Spacious retreat with twin beds — ideal for families or friends traveling together.',
  suite: 'Our finest accommodation with separate living area, premium amenities, and panoramic views.',
};

const roomAmenities = {
  single: ['Free Wi-Fi', 'Air Conditioning', 'Room Service'],
  double: ['Free Wi-Fi', 'Air Conditioning', 'Room Service', 'Mini Bar'],
  suite: ['Free Wi-Fi', 'Air Conditioning', 'Room Service', 'Mini Bar', 'Lounge Area', 'City View'],
};

export default function PublicBooking() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ guestName: '', guestPhone: '', roomId: '', checkIn: '', checkOut: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentReturn, setPaymentReturn] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [crashError, setCrashError] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);

  useEffect(() => {
    if (!form.roomId) {
      setBookedDates([]);
      return;
    }
    setLoadingDates(true);
    getBookedDatesForRoom(form.roomId)
      .then((dates) => setBookedDates(dates))
      .catch((err) => console.warn('Could not load booked dates:', err))
      .finally(() => setLoadingDates(false));
  }, [form.roomId]);

  const isOverlapping = (start, end) => {
    if (!start || !end || bookedDates.length === 0) return false;
    const checkInDate = new Date(`${start}T12:00:00.000Z`);
    const checkOutDate = new Date(`${end}T12:00:00.000Z`);
    return bookedDates.some((b) => {
      const bIn = new Date(b.checkIn);
      const bOut = new Date(b.checkOut);
      return checkInDate < bOut && checkOutDate > bIn;
    });
  };

  useEffect(() => {
    const handleGlobalError = (event) => {
      setCrashError(event.error?.stack || event.message || 'Unknown global error');
    };
    const handleRejection = (event) => {
      setCrashError(event.reason?.stack || event.reason?.message || String(event.reason));
    };
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);

    const queryParams = new URLSearchParams(window.location.search);
    const txRefFromUrl = queryParams.get('trx_ref') || queryParams.get('tx_ref') || queryParams.get('txRef');
    
    const storedBookingId = localStorage.getItem('pending_booking_id');
    const storedTxRef = localStorage.getItem('pending_tx_ref');

    let bookingId = queryParams.get('bookingId') || storedBookingId;
    if (txRefFromUrl && !bookingId && txRefFromUrl.startsWith('booking-')) {
      const parts = txRefFromUrl.split('-');
      if (parts[1]) {
        bookingId = parts[1];
      }
    }

    const txRef = txRefFromUrl || storedTxRef;
    const isPaymentReturn = queryParams.get('status') === 'payment-return' || Boolean(txRef);

    if (isPaymentReturn && bookingId) {
      setCheckingPayment(true);
      localStorage.removeItem('pending_booking_id');
      localStorage.removeItem('pending_tx_ref');

      setTimeout(async () => {
        try {
          try {
            if (txRef) {
              await verifyPayment(txRef);
            }
          } catch (err) {
            console.warn('Manual verification error:', err);
          }
          const booking = await getPublicBooking(bookingId);
          setPaymentReturn(booking);
        } catch (err) {
          setError(err.message || 'Failed to verify payment status');
        } finally {
          setCheckingPayment(false);
        }
      }, 1500);
    }

    getRooms({ publicOnly: true })
      .then((r) => setRooms(r))
      .catch((err) => setError(err.message || 'Could not load rooms'))
      .finally(() => setLoading(false));
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const selectedRoom = rooms.find((r) => r.id === form.roomId);
  const nights = form.checkIn && form.checkOut
    ? Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / (1000 * 60 * 60 * 24))
    : 0;
  const total = selectedRoom && nights > 0 ? selectedRoom.pricePerNight * nights : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.roomId) { setError('Please select a room'); return; }
    if (nights <= 0) { setError('Check-out must be after check-in'); return; }
    if (isOverlapping(form.checkIn, form.checkOut)) {
      setError('The selected dates are already booked for this room. Please choose another date range.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createBooking({
        roomId: form.roomId,
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
      });
      setSuccess(result);
    } catch (err) {
      setError(err.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ guestName: '', guestPhone: '', roomId: '', checkIn: '', checkOut: '' });
    setSuccess(null);
    setPaymentReturn(null);
    setError('');
    window.history.replaceState({}, document.title, window.location.pathname);
    getRooms({ publicOnly: true }).then((r) => setRooms(r));
  };

  const handlePay = async (bookingId, email, guestPhone) => {
    setPaying(true);
    setError('');
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?status=payment-return&bookingId=${bookingId}`;
      const res = await initiatePayment(bookingId, { email, guestPhone, returnUrl });
      if (res.checkoutUrl) {
        localStorage.setItem('pending_booking_id', bookingId);
        if (res.txRef) {
          localStorage.setItem('pending_tx_ref', res.txRef);
        }
        window.location.href = res.checkoutUrl;
      } else {
        throw new Error('Failed to retrieve Chapa checkout URL');
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate payment');
      setPaying(false);
    }
  };

  if (crashError) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6 text-center">
        <div className="glass-card max-w-lg w-full p-8 border border-red-500/30">
          <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-6 mx-auto">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-surface-100 mb-4">Application Error</h2>
          <pre className="bg-black/50 p-4 rounded-lg text-xs text-red-300 overflow-auto max-h-60 font-mono text-left whitespace-pre-wrap">
            {crashError}
          </pre>
          <button onClick={() => window.location.reload()} className="btn-accent w-full mt-6">
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  /* ─── Render ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-surface-950 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-[-200px] left-[-100px] w-[700px] h-[700px] bg-gradient-to-br from-primary-700/8 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-150px] right-[-50px] w-[600px] h-[600px] bg-gradient-to-br from-accent-600/6 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* ─── Navbar ─── */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-4 border-b border-surface-800/60 bg-surface-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
            <Hotel size={20} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-surface-100 tracking-tight">StaySync</span>
            <p className="text-[10px] text-surface-500 uppercase tracking-[0.15em] -mt-0.5">Hotel & Suites</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => navigate('/login')} className="text-sm text-surface-500 hover:text-primary-400 transition-colors font-medium">
            Staff Portal →
          </button>
        </div>
      </nav>

      {/* ─── Payment Verifying State ─── */}
      {checkingPayment ? (
        <div className="relative z-10 flex items-center justify-center min-h-[70vh] px-6">
          <div className="glass-card p-12 text-center max-w-md w-full animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-primary-500/10 border border-primary-500/30 flex items-center justify-center mx-auto mb-6">
              <Loader2 size={28} className="text-primary-400 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-surface-100 mb-2">Verifying your payment</h2>
            <p className="text-surface-400 text-sm leading-relaxed">Please wait while we confirm your transaction with Chapa. This usually takes a few seconds.</p>
          </div>
        </div>

      ) : paymentReturn ? (
        /* ─── Payment Result State ─── */
        <div className="relative z-10 flex items-center justify-center min-h-[70vh] px-6">
          <div className="glass-card p-10 text-center max-w-md w-full animate-scale-in">
            {paymentReturn.paymentStatus === 'paid' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={36} className="text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-surface-100 mb-2">Payment Confirmed</h2>
                <p className="text-surface-400 mb-8 text-sm">Thank you, {paymentReturn.guestName}. Your reservation is fully confirmed and paid.</p>
              </>
            ) : paymentReturn.paymentStatus === 'failed' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={36} className="text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-surface-100 mb-2">Payment Failed</h2>
                <p className="text-surface-400 mb-8 text-sm">We couldn't process your payment. You can try again or pay at the property.</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto mb-6">
                  <Clock size={36} className="text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-surface-100 mb-2">Payment Pending</h2>
                <p className="text-surface-400 mb-8 text-sm">We're waiting for confirmation from Chapa. This will update automatically.</p>
              </>
            )}

            <div className="rounded-xl bg-surface-800/50 border border-surface-700/30 divide-y divide-surface-700/20 text-left mb-8">
              <div className="flex justify-between items-center px-5 py-3.5">
                <span className="text-sm text-surface-400">Room</span>
                <span className="text-sm text-surface-200 font-medium">#{paymentReturn.roomDetails?.roomNumber || paymentReturn.room?.roomNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5">
                <span className="text-sm text-surface-400">Status</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize
                  ${paymentReturn.paymentStatus === 'paid' ? 'bg-green-500/15 text-green-400' : 
                    paymentReturn.paymentStatus === 'failed' ? 'bg-red-500/15 text-red-400' : 
                    'bg-amber-500/15 text-amber-400'}`}
                >
                  {paymentReturn.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between items-center px-5 py-4">
                <span className="text-sm text-surface-400 font-medium">Total Paid</span>
                <span className="text-xl font-bold text-surface-100">{paymentReturn.totalPrice?.toLocaleString()} <span className="text-sm font-normal text-surface-400">ETB</span></span>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            {paymentReturn.paymentStatus !== 'paid' && (
              <button 
                onClick={() => handlePay(paymentReturn.id, null, paymentReturn.guestPhone)} 
                disabled={paying}
                className="btn-accent w-full mb-3 flex items-center justify-center gap-2 py-3.5"
              >
                {paying ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                Try Paying Again
              </button>
            )}
            <button onClick={resetForm} className="btn-ghost w-full">Book Another Room</button>
          </div>
        </div>

      ) : !success ? (
        /* ─── Main Booking Flow ─── */
        <div className="relative z-10">
          {/* Hero */}
          <div className="text-center pt-14 pb-10 px-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-6 tracking-wide">
              <Star size={12} /> Trusted by 500+ guests
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
              <span className="text-surface-100">Find your perfect </span>
              <span className="bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent">room</span>
            </h1>
            <p className="text-surface-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              Premium rooms at competitive prices. Book directly for the best rate — no middlemen, no hidden fees.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 space-y-10 animate-slide-up">
            
            {/* ─── Room Selection ─── */}
            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center">
                  <span className="text-primary-400 font-bold text-sm">1</span>
                </div>
                <h2 className="text-lg font-semibold text-surface-200">Select your room</h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="text-primary-400 animate-spin" />
                </div>
              ) : rooms.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <p className="text-surface-400">No rooms available right now. Please check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rooms.map((room) => {
                    const isSelected = form.roomId === room.id;
                    const type = room.type || 'single';
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setForm({ ...form, roomId: room.id })}
                        className={`group relative text-left rounded-2xl overflow-hidden transition-all duration-300 border-2
                          ${isSelected
                            ? 'border-accent-500/70 shadow-[0_0_30px_rgba(255,152,0,0.12)] scale-[1.01]'
                            : 'border-surface-700/30 hover:border-surface-600/50 hover:shadow-glass hover:-translate-y-1'
                          }`}
                      >
                        {/* Room Image */}
                        <div className="relative h-44 overflow-hidden bg-surface-800">
                          <img
                            src={roomImages[type] || roomImages.single}
                            alt={roomLabels[type]}
                            className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-surface-950/20 to-transparent" />
                          
                          {/* Room number badge */}
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-mono text-white/90">
                            Room {room.roomNumber}
                          </div>

                          {isSelected && (
                            <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center shadow-glow-accent">
                              <CheckCircle size={16} className="text-white" />
                            </div>
                          )}

                          {/* Price overlay */}
                          <div className="absolute bottom-3 right-3">
                            <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                              <span className="text-xl font-bold text-white">{room.pricePerNight.toLocaleString()}</span>
                              <span className="text-white/60 text-xs ml-1">ETB/night</span>
                            </div>
                          </div>
                        </div>

                        {/* Room Info */}
                        <div className="p-5 bg-surface-900/80">
                          <h3 className="font-semibold text-surface-100 mb-1">{roomLabels[type]}</h3>
                          <p className="text-xs text-surface-400 leading-relaxed mb-3">{roomDescriptions[type]}</p>
                          
                          {/* Amenities */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(roomAmenities[type] || []).slice(0, 4).map((a) => (
                              <span key={a} className="px-2 py-0.5 text-[10px] rounded-full bg-surface-800 text-surface-400 border border-surface-700/40">{a}</span>
                            ))}
                          </div>
                          
                          {/* Trust line */}
                          <div className="flex items-center gap-1.5 text-[11px] text-green-400/80">
                            <Shield size={11} />
                            <span>Free cancellation · Pay online or at property</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ─── Guest Details ─── */}
            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center">
                  <span className="text-primary-400 font-bold text-sm">2</span>
                </div>
                <h2 className="text-lg font-semibold text-surface-200">Your details</h2>
              </div>

              <div className="glass-card p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label-text flex items-center gap-1.5"><User size={13} /> Full Name</label>
                    <input value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} className="input-field" placeholder="e.g. Abebe Kebede" required />
                  </div>
                  <div>
                    <label className="label-text flex items-center gap-1.5"><Phone size={13} /> Phone Number</label>
                    <input value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} className="input-field" placeholder="+251 9..." required />
                  </div>
                </div>
              </div>
            </section>

            {/* ─── Dates ─── */}
            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center">
                  <span className="text-primary-400 font-bold text-sm">3</span>
                </div>
                <h2 className="text-lg font-semibold text-surface-200">Choose dates</h2>
              </div>

              <div className="glass-card p-6 sm:p-8">
                {!form.roomId ? (
                  <p className="text-sm text-surface-500 italic text-center py-2">Please select a room above first to choose dates.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="label-text flex items-center gap-1.5"><CalendarDays size={13} /> Check-in</label>
                        <input 
                          type="date" 
                          min={new Date().toISOString().split('T')[0]}
                          value={form.checkIn} 
                          onChange={(e) => setForm({ ...form, checkIn: e.target.value })} 
                          className="input-field" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="label-text flex items-center gap-1.5"><CalendarDays size={13} /> Check-out</label>
                        <input 
                          type="date" 
                          min={form.checkIn || new Date().toISOString().split('T')[0]}
                          value={form.checkOut} 
                          onChange={(e) => setForm({ ...form, checkOut: e.target.value })} 
                          className="input-field" 
                          required 
                        />
                      </div>
                    </div>

                    {/* Overlap alert */}
                    {isOverlapping(form.checkIn, form.checkOut) && (
                      <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-fade-in">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>These dates are already booked for this room. Please select another date range.</span>
                      </div>
                    )}

                    {/* Booked dates list */}
                    {bookedDates.length > 0 && (
                      <div className="mt-5 text-xs bg-surface-800/40 p-4 rounded-xl border border-surface-700/20">
                        <p className="font-semibold text-surface-300 mb-2 flex items-center gap-1.5">
                          <Clock size={12} className="text-accent-400" />
                          Unavailable Dates (Already Booked):
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-surface-400">
                          {bookedDates.map((range, idx) => {
                            const start = new Date(range.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            const end = new Date(range.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            return (
                              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/20 border border-surface-700/10">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                <span>{start} — {end}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* ─── Price Summary ─── */}
            {total > 0 && (
              <section className="animate-fade-in">
                <div className="glass-card p-6 sm:p-8 border-accent-500/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-surface-400 mb-1">
                        {nights} night{nights > 1 ? 's' : ''} · Room #{selectedRoom?.roomNumber} · {roomLabels[selectedRoom?.type] || selectedRoom?.type}
                      </p>
                      <p className="text-xs text-surface-500">
                        {selectedRoom?.pricePerNight.toLocaleString()} ETB × {nights} night{nights > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-extrabold text-surface-100 tracking-tight">
                        {total.toLocaleString()}
                      </p>
                      <p className="text-xs text-surface-400 mt-0.5">ETB total</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-surface-700/30 flex items-center gap-2 text-xs text-green-400/80">
                    <Shield size={12} />
                    <span>Best rate guaranteed · No hidden charges · Pay securely with Chapa</span>
                  </div>
                </div>
              </section>
            )}

            {/* ─── Error ─── */}
            {error && (
              <div className="px-5 py-4 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-fade-in">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ─── Submit ─── */}
            <button type="submit" disabled={submitting} className="btn-accent w-full !py-4 text-base font-semibold flex items-center justify-center gap-2.5 disabled:opacity-50 shadow-glow-accent hover:shadow-[0_0_30px_rgba(255,152,0,0.35)] transition-shadow duration-300">
              {submitting ? (
                <><Loader2 size={18} className="animate-spin" /> Processing...</>
              ) : (
                <><ArrowRight size={18} /> Confirm Booking</>
              )}
            </button>

            {/* ─── Trust footer ─── */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 pb-8 text-xs text-surface-500">
              <span className="flex items-center gap-1.5"><Shield size={13} /> Secure booking</span>
              <span className="flex items-center gap-1.5"><Clock size={13} /> Instant confirmation</span>
              <span className="flex items-center gap-1.5"><CreditCard size={13} /> Pay online or at hotel</span>
            </div>
          </form>
        </div>

      ) : (
        /* ─── Booking Confirmed → Pay ─── */
        <div className="relative z-10 flex items-center justify-center min-h-[70vh] px-6 py-12">
          <div className="glass-card max-w-md w-full p-10 text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-surface-100 mb-2">Booking Confirmed!</h2>
            <p className="text-surface-400 text-sm mb-8">Thank you, {success.guestName}. Your reservation is confirmed.</p>

            <div className="rounded-xl bg-surface-800/50 border border-surface-700/30 divide-y divide-surface-700/20 text-left mb-8">
              <div className="flex justify-between items-center px-5 py-3.5">
                <span className="text-sm text-surface-400">Room</span>
                <span className="text-sm text-surface-200 font-medium">#{success.roomDetails?.roomNumber}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5">
                <span className="text-sm text-surface-400">Check-in</span>
                <span className="text-sm text-surface-200">{new Date(success.checkIn).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5">
                <span className="text-sm text-surface-400">Check-out</span>
                <span className="text-sm text-surface-200">{new Date(success.checkOut).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-4">
                <span className="text-sm text-surface-400 font-medium">Total</span>
                <span className="text-xl font-bold text-surface-100">{success.totalPrice?.toLocaleString()} <span className="text-sm font-normal text-surface-400">ETB</span></span>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <button 
              onClick={() => handlePay(success.id, null, success.guestPhone)} 
              disabled={paying}
              className="btn-accent w-full mb-3 flex items-center justify-center gap-2.5 py-4 text-base font-semibold shadow-glow-accent hover:shadow-[0_0_30px_rgba(255,152,0,0.35)] transition-shadow duration-300"
            >
              {paying ? (
                <><Loader2 size={16} className="animate-spin" /> Preparing Payment...</>
              ) : (
                <><CreditCard size={16} /> Pay with Chapa Now</>
              )}
            </button>

            <p className="text-xs text-surface-500 mb-4">Or pay at the property during check-in</p>

            <button onClick={resetForm} className="btn-ghost w-full">Book Another Room</button>
          </div>
        </div>
      )}
    </div>
  );
}
