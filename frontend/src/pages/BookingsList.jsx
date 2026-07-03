import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, XCircle, Loader2, CalendarDays, Filter, FileDown, LogIn, LogOut } from 'lucide-react';
import Header from '../components/Header';
import { getBookings, cancelBooking, downloadInvoice, checkInBooking, checkOutBooking } from '../services/api';

export default function BookingsList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelling, setCancelling] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadBookings = async () => {
    setLoading(true);
    try {
      setBookings(await getBookings());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, []);

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await cancelBooking(id);
      await loadBookings();
    } finally {
      setCancelling(null);
    }
  };

  const handleCheckIn = async (id) => {
    setActionLoading(id);
    try {
      await checkInBooking(id);
      await loadBookings();
    } catch (err) {
      alert(err.message || 'Check-in failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (id) => {
    setActionLoading(id);
    try {
      await checkOutBooking(id);
      await loadBookings();
    } catch (err) {
      alert(err.message || 'Check-out failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvoice = async (id) => {
    setDownloading(id);
    try {
      await downloadInvoice(id);
    } catch (err) {
      alert(err.message || 'Could not download invoice');
    } finally {
      setDownloading(null);
    }
  };

  const filtered = bookings.filter((b) => {
    const matchSearch = b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.guestPhone.includes(search) ||
      b.roomDetails?.roomNumber?.includes(search);
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusClass = (s) => {
    const map = { 
      confirmed: 'px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20', 
      checked_in: 'px-2.5 py-1 rounded-full text-xs font-semibold bg-success-500/10 text-green-400 border border-green-500/20', 
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
      <Header title="Bookings" subtitle="Manage reservations, billing, and check-in statuses" />

      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-550" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guest name, phone, or room..."
              className="input-field pl-11 !bg-surface-900/50 border-surface-800 hover:border-surface-700 focus:border-primary-500/50"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-550 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-field pl-10 pr-8 w-full sm:w-52 !bg-surface-900/50 border-surface-800 hover:border-surface-700 focus:border-primary-500/50"
            >
              <option value="all">All Reservation Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="cancelled">Cancelled</option>
              <option value="checked_out">Checked Out</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="text-primary-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <CalendarDays size={44} className="text-surface-700 mx-auto mb-4" />
              <p className="text-surface-400 font-semibold text-lg">No bookings match your criteria</p>
              <p className="text-xs text-surface-500 mt-1.5">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-surface-850 bg-surface-900/30">
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Guest</th>
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Room</th>
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Check-in</th>
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Check-out</th>
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">Payment</th>
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest text-right">Total</th>
                    <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-850/50">
                  {filtered.map((b, i) => (
                    <tr
                      key={b.id}
                      className="hover:bg-surface-900/40 transition-colors duration-150 animate-slide-up"
                      style={{ animationDelay: `${i * 0.02}s`, animationFillMode: 'both' }}
                    >
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
                        {format(new Date(b.checkIn), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4.5 text-sm text-surface-300">
                        {format(new Date(b.checkOut), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={statusClass(b.status)}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={paymentClass(b.paymentStatus)}>
                          {b.paymentStatus === 'paid' ? '✓ Paid' : b.paymentStatus === 'failed' ? '✗ Failed' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <span className="text-base font-bold text-surface-100">{b.totalPrice?.toLocaleString()}</span>
                        <span className="text-[10px] text-surface-500 ml-1.5 uppercase font-medium">ETB</span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          {b.status !== 'cancelled' && (
                            <button
                              onClick={() => handleInvoice(b.id)}
                              disabled={downloading === b.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                text-primary-300 bg-primary-500/10 border border-primary-500/20
                                hover:bg-primary-500/25 transition-all disabled:opacity-50"
                            >
                              {downloading === b.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <FileDown size={12} />
                              )}
                              Invoice
                            </button>
                          )}
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => handleCheckIn(b.id)}
                              disabled={actionLoading === b.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                text-green-300 bg-green-500/10 border border-green-500/20
                                hover:bg-green-500/25 transition-all disabled:opacity-50"
                            >
                              {actionLoading === b.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <LogIn size={12} />
                              )}
                              Check In
                            </button>
                          )}
                          {b.status === 'checked_in' && (
                            <button
                              onClick={() => handleCheckOut(b.id)}
                              disabled={actionLoading === b.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                text-amber-300 bg-amber-500/10 border border-amber-500/20
                                hover:bg-amber-500/25 transition-all disabled:opacity-50"
                            >
                              {actionLoading === b.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <LogOut size={12} />
                              )}
                              Check Out
                            </button>
                          )}
                          {(b.status === 'confirmed' || b.status === 'checked_in') && (
                            <button
                              onClick={() => handleCancel(b.id)}
                              disabled={cancelling === b.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                text-red-400 bg-red-500/10 border border-red-500/20
                                hover:bg-red-500/25 transition-all disabled:opacity-50"
                            >
                              {cancelling === b.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <XCircle size={12} />
                              )}
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between mt-4 px-2 text-xs text-surface-500">
            <span>Showing {filtered.length} booking{filtered.length !== 1 ? 's' : ''}</span>
            <span>
              Total Revenue: <span className="font-bold text-surface-300">{filtered.filter((b) => b.status !== 'cancelled').reduce((s, b) => s + (b.totalPrice || 0), 0).toLocaleString()} ETB</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
