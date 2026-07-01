import { useState, useEffect } from 'react';
import { Plus, Pencil, X, BedDouble, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { getRooms, createRoom, updateRoom } from '../services/api';
import { useAuth } from '../context/AuthContext';

const typeColors = {
  single: 'bg-primary-500/15 text-primary-300 border border-primary-500/25',
  double: 'bg-accent-500/15 text-accent-300 border border-accent-500/25',
  suite: 'bg-purple-500/15 text-purple-300 border border-purple-500/25',
};

const typeIcons = { single: '🛏️', double: '🛏️🛏️', suite: '👑' };

export default function RoomManagement() {
  const { isOwner } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ roomNumber: '', type: 'single', pricePerNight: '', status: 'available' });
  const [saving, setSaving] = useState(false);

  const loadRooms = async () => {
    setLoading(true);
    try {
      setRooms(await getRooms());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRooms(); }, []);

  const openAdd = () => {
    setForm({ roomNumber: '', type: 'single', pricePerNight: '', status: 'available' });
    setModal('add');
  };

  const openEdit = (room) => {
    setSelected(room);
    setForm({ roomNumber: room.roomNumber, type: room.type, pricePerNight: room.pricePerNight, status: room.status });
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'add') {
        await createRoom({ roomNumber: form.roomNumber, type: form.type, pricePerNight: Number(form.pricePerNight) });
      } else if (modal === 'edit') {
        await updateRoom(selected.id, { pricePerNight: Number(form.pricePerNight), status: form.status });
      }
      setModal(null);
      await loadRooms();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <Header title="Rooms" subtitle="Manage your property rooms" />

      <div className="p-6 lg:p-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-surface-400 text-sm">{rooms.length} rooms total</p>
          {isOwner && (
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus size={18} /> Add Room
            </button>
          )}
        </div>

        {/* Room Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card-light p-6 animate-pulse-soft">
                <div className="h-6 w-16 bg-surface-700/50 rounded mb-4" />
                <div className="h-4 w-24 bg-surface-700/30 rounded mb-2" />
                <div className="h-4 w-20 bg-surface-700/30 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room, i) => (
              <div
                key={room.id}
                className="glass-card-light p-6 hover:scale-[1.02] hover:border-primary-500/30 transition-all duration-300 animate-slide-up group"
                style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-surface-100">
                      <span className="text-surface-500 text-base font-normal mr-1">#</span>
                      {room.roomNumber}
                    </h3>
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium mt-1 ${typeColors[room.type]}`}>
                      {typeIcons[room.type]} {room.type}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-800/60 flex items-center justify-center">
                    <BedDouble size={18} className="text-surface-400" />
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-2xl font-bold text-surface-100">
                    {room.pricePerNight.toLocaleString()}
                    <span className="text-sm text-surface-500 font-normal ml-1">ETB/night</span>
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`status-${room.status}`}>{room.status}</span>
                  {isOwner && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(room)} className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-primary-400 transition-colors">
                        <Pencil size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setModal(null)}>
          <div className="glass-card w-full max-w-md mx-4 p-8 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-surface-100">{modal === 'add' ? 'Add New Room' : 'Edit Room'}</h2>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-surface-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {modal === 'add' && (
                <div>
                  <label className="label-text">Room Number</label>
                  <input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} className="input-field" placeholder="e.g. 401" />
                </div>
              )}
              {modal === 'add' && (
                <div>
                  <label className="label-text">Room Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="select-field">
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>
              )}
              <div>
                <label className="label-text">Price per Night (ETB)</label>
                <input type="number" value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })} className="input-field" placeholder="1500" />
              </div>
              {modal === 'edit' && (
                <div>
                  <label className="label-text">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="select-field">
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setModal(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {modal === 'add' ? 'Add Room' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
