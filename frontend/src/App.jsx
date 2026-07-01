import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RoomManagement from './pages/RoomManagement';
import BookingCalendar from './pages/BookingCalendar';
import BookingsList from './pages/BookingsList';
import PublicBooking from './pages/PublicBooking';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/book" element={<PublicBooking />} />

          {/* Protected admin routes */}
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/rooms"
            element={
              <DashboardLayout>
                <RoomManagement />
              </DashboardLayout>
            }
          />
          <Route
            path="/calendar"
            element={
              <DashboardLayout>
                <BookingCalendar />
              </DashboardLayout>
            }
          />
          <Route
            path="/bookings"
            element={
              <DashboardLayout>
                <BookingsList />
              </DashboardLayout>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/book" replace />} />
          <Route path="*" element={<Navigate to="/book" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
