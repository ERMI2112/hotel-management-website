import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hotel, CheckCircle, Loader2, User, Phone, CalendarDays, ArrowRight } from 'lucide-react';
import { getRooms, createBooking } from '../services/api';

const typeLabels = { single: '🛏️ Single', double: '🛏️🛏️ Double', suite: '👑 Suite' };

export default function PublicBooking() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ guestName: '', guestPhone: '', roomId: '', checkIn: '', checkOut: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    getRooms({ publicOnly: true })
      .then((r) => setRooms(r))
      .catch((err) => setError(err.message || 'Could not load rooms'))
      .finally(() => setLoading(false));
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
    setError('');
    getRooms({ publicOnly: true }).then((r) => setRooms(r));
  };

  return (
    <div className="min-h-screen bg-surface-950 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary-600/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-accent-500/8 to-transparent rounded-full blur-3xl" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 border-b border-surface-700/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
            <Hotel size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-primary-300 to-accent-400 bg-clip-text text-transparent">StaySync</span>
        </div>
        <button onClick={() => navigate('/login')} className="text-sm text-surface-400 hover:text-primary-400 transition-colors font-medium">
          Staff Login →
        </button>
      </nav>

      {/* Hero */}
      <div className="relative z-10 text-center py-16 px-6 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-primary-300 via-primary-200 to-accent-400 bg-clip-text text-transparent">
            Book Your Perfect Stay
          </span>
        </h1>
        <p className="text-surface-400 text-lg max-w-md mx-auto">
          Experience comfort and luxury at competitive prices
        </p>
      </div>

      {/* Booking Form */}
      {!success ? (
        <div className="relative z-10 max-w-3xl mx-auto px-6 pb-20 animate-slide-up">
          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-8">
            {/* Guest Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label-text flex items-center gap-2"><User size={14} /> Guest Name</label>
                <input value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} className="input-field" placeholder="Full name" required />
              </div>
              <div>
                <label className="label-text flex items-center gap-2"><Phone size={14} /> Phone Number</label>
                <input value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} className="input-field" placeholder="+251..." required />
              </div>
            </div>

            {/* Room Selection */}
            <div>
              <label className="label-text flex items-center gap-2 mb-3">Select a Room</label>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-8 text-surface-500">No rooms available right now</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setForm({ ...form, roomId: room.id })}
                      className={`p-4 rounded-xl border text-left transition-all duration-200
                        ${form.roomId === room.id
                          ? 'border-primary-500/60 bg-primary-500/10 shadow-glow ring-1 ring-primary-500/30'
                          : 'border-surface-700/40 bg-surface-800/30 hover:border-surface-600/60 hover:bg-surface-800/50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-surface-100">#{room.roomNumber}</span>
                        {form.roomId === room.id && <CheckCircle size={16} className="text-primary-400" />}
                      </div>
                      <p className="text-xs text-surface-400 mb-1">{typeLabels[room.type]}</p>
                      <p className="text-lg font-bold text-surface-100">
                        {room.pricePerNight.toLocaleString()} <span className="text-xs text-surface-500 font-normal">ETB/night</span>
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label-text flex items-center gap-2"><CalendarDays size={14} /> Check-in</label>
                <input type="date" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="label-text flex items-center gap-2"><CalendarDays size={14} /> Check-out</label>
                <input type="date" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} className="input-field" required />
              </div>
            </div>

            {/* Price Summary */}
            {total > 0 && (
              <div className="p-5 rounded-xl bg-gradient-to-r from-primary-600/10 to-accent-500/10 border border-primary-500/20 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-surface-400">
                      {nights} night{nights > 1 ? 's' : ''} × {selectedRoom?.pricePerNight.toLocaleString()} ETB
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">Room #{selectedRoom?.roomNumber} · {selectedRoom?.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-surface-100">
                      {total.toLocaleString()} <span className="text-sm text-surface-400 font-normal">ETB</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-accent w-full !py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? (
                <><Loader2 size={18} className="animate-spin" /> Processing...</>
              ) : (
                <>Confirm Booking <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Success State */
        <div className="relative z-10 max-w-md mx-auto px-6 pb-20 animate-scale-in">
          <div className="glass-card p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-surface-100 mb-2">Booking Confirmed!</h2>
            <p className="text-surface-400 mb-6">Thank you, {success.guestName}. Your reservation is confirmed.</p>

            <div className="p-5 rounded-xl bg-surface-800/40 text-left space-y-3 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Room</span>
                <span className="text-surface-200 font-mono">#{success.roomDetails?.roomNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Check-in</span>
                <span className="text-surface-200">{new Date(success.checkIn).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Check-out</span>
                <span className="text-surface-200">{new Date(success.checkOut).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-surface-700/30">
                <span className="text-surface-400 font-medium">Total</span>
                <span className="text-surface-100 font-bold text-lg">{success.totalPrice?.toLocaleString()} ETB</span>
              </div>
            </div>

            <button onClick={resetForm} className="btn-ghost w-full">Book Another Room</button>
          </div>
        </div>
      )}
    </div>
  );
}
