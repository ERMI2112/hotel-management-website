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
        { label: 'Total Rooms', value: stats.totalRooms, icon: BedDouble, color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
        { label: 'Occupied', value: stats.occupied, icon: Users, color: 'text-accent-400', bg: 'bg-accent-500/10 border-accent-500/20' },
        { label: 'Available', value: stats.available, icon: CheckCircle, color: 'text-green-400', bg: 'bg-success-500/10 border-green-500/20' },
        { label: 'Revenue', value: `${stats.totalRevenue.toLocaleString()} ETB`, icon: TrendingUp, color: 'text-accent-400', bg: 'bg-accent-500/10 border-accent-500/20' },
      ]
    : [];

  const statusClass = (s) => {
    const map = { 
      confirmed: 'px-2.5 py-1 rounded-full text-xs font-semibold bg-success-500/10 text-green-400 border border-green-500/20', 
      cancelled: 'px-2.5 py-1 rounded-full text-xs font-semibold bg-danger-500/10 text-red-400 border border-red-500/20', 
      checked_out: 'px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-800 text-surface-400 border border-surface-700/50' 
    };
    return map[s] || 'px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-800 text-surface-400';
  };

  const paymentClass = (p) => {
    const map = {
      paid: 'px-2.5 py-0.5 rounded-md text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20',
      pending: 'px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20',
      failed: 'px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20',
    };
    return map[p] || map.pending;
  };

  return (
    <div className="animate-fade-in flex-1 bg-surface-950">
      <Header title="Overview" subtitle="Real-time property stats and occupancy tracker" />

      <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card p-6 animate-pulse-soft">
                  <div className="w-10 h-10 rounded-xl bg-surface-800 mb-4 animate-pulse" />
                  <div className="h-8 w-24 bg-surface-800 rounded mb-2 animate-pulse" />
                  <div className="h-4 w-16 bg-surface-800 rounded animate-pulse" />
                </div>
              ))
            : statCards.map((card, i) => (
                <div
                  key={card.label}
                  className="glass-card p-6 hover:scale-[1.01] hover:border-surface-650 hover:shadow-glass transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${card.bg}`}>
                    <card.icon size={22} className={card.color} />
                  </div>
                  <p className="text-3xl font-extrabold text-surface-100 tracking-tight">{card.value}</p>
                  <p className="text-sm font-medium text-surface-400 mt-1.5">{card.label}</p>
                </div>
              ))}
        </div>

        {/* Recent Bookings */}
        <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="px-6 py-5 border-b border-surface-850 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-surface-100 tracking-tight">Recent Activity</h2>
              <p className="text-xs text-surface-400 mt-0.5">Latest guests and booking statuses</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-surface-800 text-xs font-semibold text-surface-300 border border-surface-700/50">
              {bookings.length} bookings
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <Loader2 size={32} className="text-primary-400 animate-spin mx-auto" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-16 text-center">
              <CalendarDays size={40} className="text-surface-600 mx-auto mb-3" />
              <p className="text-surface-400 font-medium">No bookings recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-surface-850 bg-surface-900/30">
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Guest</th>
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Room</th>
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Stay Period</th>
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Payment</th>
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-850/50">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-900/40 transition-colors duration-150">
                      <td className="px-6 py-4.5">
                        <p className="font-semibold text-surface-100">{b.guestName}</p>
                        <p className="text-xs text-surface-500 mt-0.5">{b.guestPhone}</p>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="px-2.5 py-1 rounded-lg bg-surface-800 text-surface-200 text-xs font-mono border border-surface-700/40">
                          Room {b.roomDetails?.roomNumber || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-sm text-surface-300">
                        <div className="flex flex-col">
                          <span>{format(new Date(b.checkIn), 'MMM dd, yyyy')}</span>
                          <span className="text-[10px] text-surface-500 mt-0.5">to {format(new Date(b.checkOut), 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={statusClass(b.status)}>{b.status.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={paymentClass(b.paymentStatus)}>
                          {b.paymentStatus === 'paid' ? '✓ Paid' : b.paymentStatus === 'failed' ? '✗ Failed' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <span className="text-base font-bold text-surface-100">{b.totalPrice?.toLocaleString()}</span>
                        <span className="text-[10px] text-surface-400 ml-1.5 uppercase font-medium">ETB</span>
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
