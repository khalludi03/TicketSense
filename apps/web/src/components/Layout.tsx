import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/useAuth';

export function Layout() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return <Outlet />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="text-lg font-bold text-slate-900">
            TicketSense
          </Link>
          <nav className="flex flex-wrap items-center gap-4">
            <Link to="/tickets" className="text-sm text-slate-600 hover:text-slate-900">
              Tickets
            </Link>
            {user.role === 'customer' && (
              <Link to="/tickets/new" className="text-sm text-slate-600 hover:text-slate-900">
                New Ticket
              </Link>
            )}
            {user.role === 'admin' && (
              <>
                <Link to="/admin/categories" className="text-sm text-slate-600 hover:text-slate-900">
                  Categories
                </Link>
                <Link to="/admin/users" className="text-sm text-slate-600 hover:text-slate-900">
                  Users
                </Link>
                <Link to="/admin/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
                  AI Metrics
                </Link>
              </>
            )}
            <span className="text-xs text-slate-400">
              {user.name} · {user.role}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
