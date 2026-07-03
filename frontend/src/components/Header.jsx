import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Header({ title, subtitle }) {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : '?';

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-surface-700/30 bg-surface-950/40 backdrop-blur-lg animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">{title}</h1>
        {subtitle && <p className="text-sm text-surface-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-surface-200">{user?.name}</p>
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest mt-0.5
              ${user?.role === 'owner'
                ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30'
                : 'bg-accent-500/15 text-accent-300 border border-accent-500/30'
              }`}
          >
            {user?.role}
          </span>
        </div>
        <ThemeToggle />
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold shadow-glow">
          {initials}
        </div>
      </div>
    </header>
  );
}
