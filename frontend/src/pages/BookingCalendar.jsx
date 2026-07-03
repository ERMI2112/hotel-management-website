import { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { X, Phone, User, CalendarDays, DollarSign, XCircle, LogIn, LogOut, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { getBookings, getRooms, cancelBooking, checkInBooking, checkOutBooking } from '../services/api';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS },
});

const statusColors = {
  confirmed: { bg: '#4c6ef5', label: 'Confirmed' },
  checked_in: { bg: '#22c55e', label: 'Checked In' },
  cancelled: { bg: '#ef4444', label: 'Cancelled' },
  checked_out: { bg: '#7b89a8', label: 'Checked Out' },
};

export default function BookingCalendar() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, r] = await Promise.all([getBookings(), getRooms()]);
      setBookings(b);
      setRooms(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const events = useMemo(() => {
    return bookings.map((b) => {
      const room = rooms.find((r) => r.id === b.room) || b.roomDetails;
      return {
        id: b.id,
        title: `${room?.roomNumber || '?'} — ${b.guestName}`,
        start: new Date(b.checkIn),
        end: new Date(b.checkOut),
        resource: { ...b, roomDetails: room },
      };
    });
  }, [bookings, rooms]);

  const eventPropGetter = (event) => {
    const status = event.resource.status;
    const color = statusColors[status]?.bg || '#7b89a8';
    return {
      style: {
        backgroundColor: color,
        borderRadius: '8px',
        border: 'none',
        color: '#fff',
        fontWeight: 500,
        fontSize: '0.75rem',
        padding: '2px 8px',
      },
    };
  };

  const handleSelectEvent = (event) => {
    setSelected(event.resource);
  };

  const handleCancel = async () => {
    if (!selected) return;
    setCancelling(true);
    try {
      await cancelBooking(selected.id);
      setSelected(null);
      await loadData();
    } finally {
      setCancelling(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await checkInBooking(selected.id);
      setSelected(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await checkOutBooking(selected.id);
      setSelected(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <Header title="Booking Calendar" subtitle="Visual overview of all reservations" />

      <div className="p-6 lg:p-8">
        <div className="glass-card p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                eventPropGetter={eventPropGetter}
                onSelectEvent={handleSelectEvent}
                views={['month', 'week', 'agenda']}
                defaultView="month"
                popup
                selectable={false}
              />
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-surface-700/30">
            {Object.entries(statusColors).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: val.bg }} />
                <span className="text-xs text-surface-400">{val.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)}>
          <div className="glass-card w-full max-w-md mx-4 p-8 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-surface-100">Booking Details</h2>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-surface-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-500/15 flex items-center justify-center">
                  <User size={16} className="text-primary-400" />
                </div>
                <div>
                  <p className="text-sm text-surface-400">Guest</p>
                  <p className="font-medium text-surface-100">{selected.guestName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-500/15 flex items-center justify-center">
                  <Phone size={16} className="text-accent-400" />
                </div>
                <div>
                  <p className="text-sm text-surface-400">Phone</p>
                  <p className="font-medium text-surface-100">{selected.guestPhone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center">
                  <CalendarDays size={16} className="text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-surface-400">Dates</p>
                  <p className="font-medium text-surface-100">
                    {format(new Date(selected.checkIn), 'MMM dd, yyyy')} → {format(new Date(selected.checkOut), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-800/40">
                <div>
                  <p className="text-sm text-surface-400">Room</p>
                  <p className="font-mono font-bold text-surface-100">#{selected.roomDetails?.roomNumber || '?'}</p>
                  <p className="text-xs text-surface-500 capitalize">{selected.roomDetails?.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-surface-400">Total</p>
                  <p className="text-xl font-bold text-surface-100">{selected.totalPrice?.toLocaleString()} <span className="text-xs text-surface-500">ETB</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-surface-400">Status:</span>
                <span className={`status-${selected.status}`}>{selected.status.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setSelected(null)} className="btn-ghost flex-1">Close</button>
              {selected.status === 'confirmed' && (
                <button onClick={handleCheckIn} disabled={actionLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-green-300 bg-green-500/10 border border-green-500/20 hover:bg-green-500/25 transition-all disabled:opacity-50">
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                  Check In
                </button>
              )}
              {selected.status === 'checked_in' && (
                <button onClick={handleCheckOut} disabled={actionLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/25 transition-all disabled:opacity-50">
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                  Check Out
                </button>
              )}
              {(selected.status === 'confirmed' || selected.status === 'checked_in') && (
                <button onClick={handleCancel} disabled={cancelling} className="btn-danger flex-1 flex items-center justify-center gap-2">
                  {cancelling ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
