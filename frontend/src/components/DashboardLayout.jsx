import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-surface-950">
      <Sidebar />
      {/* Main content — offset by sidebar width */}
      <main className="flex-1 ml-[72px] min-h-screen flex flex-col overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
