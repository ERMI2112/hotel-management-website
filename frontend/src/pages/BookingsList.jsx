import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, XCircle, Loader2, CalendarDays, Filter, FileDown } from 'lucide-react';
import Header from '../components/Header';
import { getBookings, cancelBooking, downloadInvoice } from '../services/api';

export default function BookingsList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelling, setCancelling] = useState(null);
  const [downloading, setDownloading] = useState(null);

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
    const map = { confirmed: 'status-confirmed', cancelled: 'status-cancelled', checked_out: 'status-checked_out' };
    return map[s] || 'status-badge bg-surface-500/15 text-surface-400';
  };

  return (
    <div className="animate-fade-in">
      <Header title="Bookings" subtitle="All reservations and their status" />

      <div className="p-6 lg:p-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guest name, phone, or room..."
              className="input-field pl-11"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-field pl-10 pr-8 w-full sm:w-48"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="checked_out">Checked Out</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays size={40} className="text-surface-600 mx-auto mb-3" />
              <p className="text-surface-400">No bookings found</p>
              <p className="text-xs text-surface-500 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-700/30">
                    <th className="table-header">Guest</th>
                    <th className="table-header">Room</th>
                    <th className="table-header">Check-in</th>
                    <th className="table-header">Check-out</th>
                    <th className="table-header">Status</th>
                    <th className="table-header text-right">Total</th>
                    <th className="table-header text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b, i) => (
                    <tr
                      key={b.id}
                      className="border-b border-surface-700/10 hover:bg-surface-800/30 transition-colors animate-slide-up"
                      style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}
                    >
                      <td className="table-cell">
                        <p className="font-medium text-surface-100">{b.guestName}</p>
                        <p className="text-xs text-surface-500">{b.guestPhone}</p>
                      </td>
                      <td className="table-cell">
                        <span className="px-2.5 py-1 rounded-lg bg-surface-800/60 text-surface-300 text-xs font-mono font-medium">
                          #{b.roomDetails?.roomNumber || '—'}
                        </span>
                      </td>
                      <td className="table-cell text-surface-300 text-sm">
                        {format(new Date(b.checkIn), 'MMM dd, yyyy')}
                      </td>
                      <td className="table-cell text-surface-300 text-sm">
                        {format(new Date(b.checkOut), 'MMM dd, yyyy')}
                      </td>
                      <td className="table-cell">
                        <span className={statusClass(b.status)}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <span className="font-semibold text-surface-100">{b.totalPrice?.toLocaleString()}</span>
                        <span className="text-xs text-surface-500 ml-1">ETB</span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="inline-flex items-center gap-2">
                          {b.status !== 'cancelled' && (
                            <button
                              onClick={() => handleInvoice(b.id)}
                              disabled={downloading === b.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                text-primary-300 bg-primary-500/10 border border-primary-500/20
                                hover:bg-primary-500/20 transition-all disabled:opacity-50"
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
                              onClick={() => handleCancel(b.id)}
                              disabled={cancelling === b.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                text-red-400 bg-red-500/10 border border-red-500/20
                                hover:bg-red-500/20 transition-all disabled:opacity-50"
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
            <span>{filtered.length} booking{filtered.length !== 1 ? 's' : ''} shown</span>
            <span>
              Total revenue: {filtered.filter((b) => b.status !== 'cancelled').reduce((s, b) => s + (b.totalPrice || 0), 0).toLocaleString()} ETB
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
