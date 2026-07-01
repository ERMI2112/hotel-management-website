import { useState, useEffect } from 'react';
import { BedDouble, Users, CheckCircle, TrendingUp, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import Header from '../components/Header';
import { getStats, getBookings } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, b] = await Promise.all([getStats(), getBookings()]);
        setStats(s);
        setBookings(b.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = stats
    ? [
        { label: 'Total Rooms', value: stats.totalRooms, icon: BedDouble, gradient: 'from-primary-500 to-primary-700', glow: 'shadow-glow' },
        { label: 'Occupied', value: stats.occupied, icon: Users, gradient: 'from-accent-500 to-accent-700', glow: 'shadow-glow-accent' },
        { label: 'Available', value: stats.available, icon: CheckCircle, gradient: 'from-green-500 to-green-700', glow: '' },
        { label: 'Revenue (ETB)', value: stats.totalRevenue.toLocaleString(), icon: TrendingUp, gradient: 'from-accent-400 to-accent-600', glow: 'shadow-glow-accent' },
      ]
    : [];

  const statusClass = (s) => {
    const map = { confirmed: 'status-confirmed', cancelled: 'status-cancelled', checked_out: 'status-checked_out' };
    return map[s] || 'status-badge bg-surface-500/15 text-surface-400';
  };

  return (
    <div className="animate-fade-in">
      <Header title="Dashboard" subtitle="Welcome back — here's your property overview" />

      <div className="p-6 lg:p-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card-light p-6 animate-pulse-soft">
                  <div className="w-10 h-10 rounded-xl bg-surface-700/50 mb-4" />
                  <div className="h-8 w-20 bg-surface-700/50 rounded mb-2" />
                  <div className="h-4 w-24 bg-surface-700/30 rounded" />
                </div>
              ))
            : statCards.map((card, i) => (
                <div
                  key={card.label}
                  className="glass-card-light p-6 hover:scale-[1.02] transition-transform duration-300 animate-slide-up"
                  style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 ${card.glow}`}>
                    <card.icon size={20} className="text-white" />
                  </div>
                  <p className="text-3xl font-bold text-surface-100">{card.value}</p>
                  <p className="text-sm text-surface-400 mt-1">{card.label}</p>
                </div>
              ))}
        </div>

        {/* Recent Bookings */}
        <div className="glass-card animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          <div className="px-6 py-5 border-b border-surface-700/30 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-100">Recent Bookings</h2>
            <span className="text-xs text-surface-500">{bookings.length} bookings</span>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays size={40} className="text-surface-600 mx-auto mb-3" />
              <p className="text-surface-400">No bookings yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-700/20">
                    <th className="table-header">Guest</th>
                    <th className="table-header">Room</th>
                    <th className="table-header">Check-in</th>
                    <th className="table-header">Check-out</th>
                    <th className="table-header">Status</th>
                    <th className="table-header text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => (
                    <tr key={b.id} className="border-b border-surface-700/10 hover:bg-surface-800/30 transition-colors">
                      <td className="table-cell">
                        <p className="font-medium text-surface-100">{b.guestName}</p>
                        <p className="text-xs text-surface-500">{b.guestPhone}</p>
                      </td>
                      <td className="table-cell">
                        <span className="px-2 py-1 rounded-lg bg-surface-800/60 text-surface-300 text-xs font-mono">
                          {b.roomDetails?.roomNumber || '—'}
                        </span>
                      </td>
                      <td className="table-cell text-surface-300">
                        {format(new Date(b.checkIn), 'MMM dd, yyyy')}
                      </td>
                      <td className="table-cell text-surface-300">
                        {format(new Date(b.checkOut), 'MMM dd, yyyy')}
                      </td>
                      <td className="table-cell">
                        <span className={statusClass(b.status)}>{b.status.replace('_', ' ')}</span>
                      </td>
                      <td className="table-cell text-right font-semibold text-surface-100">
                        {b.totalPrice?.toLocaleString()} <span className="text-xs text-surface-500">ETB</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
