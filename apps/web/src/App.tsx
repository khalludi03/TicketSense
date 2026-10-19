import { Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { TicketList } from '@/pages/TicketList';
import { TicketDetail } from '@/pages/TicketDetail';
import { CreateTicket } from '@/pages/CreateTicket';
import { AdminCategories } from '@/pages/AdminCategories';
import { AdminUsers } from '@/pages/AdminUsers';
import { AdminDashboard } from '@/pages/AdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RequireAuth({ children, role }: { children: React.ReactNode; role?: 'customer' | 'agent' | 'admin' }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/tickets" replace />} />
            <Route path="/tickets" element={<TicketList />} />
            <Route
              path="/tickets/new"
              element={
                <RequireAuth role="customer">
                  <CreateTicket />
                </RequireAuth>
              }
            />
            <Route
              path="/tickets/:id"
              element={
                <RequireAuth>
                  <TicketDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <RequireAuth role="admin">
                  <AdminCategories />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAuth role="admin">
                  <AdminUsers />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <RequireAuth role="admin">
                  <AdminDashboard />
                </RequireAuth>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}
