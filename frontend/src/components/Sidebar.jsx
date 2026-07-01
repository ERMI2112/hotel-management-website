import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Hotel, LayoutDashboard, BedDouble, CalendarDays, ClipboardList, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Rooms', icon: BedDouble, path: '/rooms' },
  { label: 'Calendar', icon: CalendarDays, path: '/calendar' },
  { label: 'Bookings', icon: ClipboardList, path: '/bookings' },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`fixed left-0 top-0 h-screen z-50 flex flex-col
        bg-surface-950/80 backdrop-blur-2xl border-r border-surface-700/30
        transition-all duration-300 ease-out animate-slide-in-left
        ${expanded ? 'w-64' : 'w-[72px]'}`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-20 border-b border-surface-700/30">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-glow">
          <Hotel size={20} className="text-white" />
        </div>
        <span className={`font-bold text-lg bg-gradient-to-r from-primary-300 to-accent-400 bg-clip-text text-transparent whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
          StaySync
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive
                  ? 'bg-primary-600/15 text-primary-300 border-l-2 border-primary-400'
                  : 'text-surface-400 hover:bg-surface-800/60 hover:text-surface-200 border-l-2 border-transparent'
                }`}
            >
              <item.icon size={20} className={`flex-shrink-0 transition-colors ${isActive ? 'text-primary-400' : 'group-hover:text-primary-400'}`} />
              <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                {item.label}
              </span>
              {/* Tooltip when collapsed */}
              {!expanded && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-surface-800 border border-surface-700/50 rounded-lg text-xs font-medium text-surface-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full group"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            Logout
          </span>
        </button>
      </div>

      {/* Right gradient border */}
      <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-primary-500/20 via-accent-500/10 to-transparent" />
    </aside>
  );
}
