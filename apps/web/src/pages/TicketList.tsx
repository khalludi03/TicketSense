import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const priorityColors = {
  low: 'secondary',
  medium: 'default',
  high: 'destructive',
} as const;

export function TicketList() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ status: '', priority: '', q: '' });
  const isStaff = user?.role === 'agent' || user?.role === 'admin';

  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.q) params.set('q', filters.q);
      return api.get(`/api/tickets?${params.toString()}`);
    },
  });

  const tickets = data?.tickets ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tickets</h1>
        {user?.role === 'customer' && (
          <Link to="/tickets/new">
            <Button>New ticket</Button>
          </Link>
        )}
      </div>

      {isStaff && (
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded border border-slate-300 bg-white p-1 text-sm"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            className="rounded border border-slate-300 bg-white p-1 text-sm"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            className="rounded border border-slate-300 bg-white p-1 text-sm"
            placeholder="Search..."
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
        </div>
      )}

      {isLoading && (
        <div className="py-8">
          <Spinner className="h-8 w-8" />
        </div>
      )}
      {error && <div className="text-red-600">Failed to load tickets</div>}
      {!isLoading && tickets.length === 0 && <div className="text-slate-500">No tickets found.</div>}

      <div className="space-y-2">
        {tickets.map((ticket: any) => (
          <Card key={ticket.id}>
            <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link to={`/tickets/${ticket.id}`} className="font-medium hover:underline">
                  {ticket.title}
                </Link>
                <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                  <span>{ticket.category?.name ?? 'Uncategorized'}</span>
                  <span>·</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant={priorityColors[ticket.priority as keyof typeof priorityColors] ?? 'default'}>
                  {ticket.priority}
                </Badge>
                <Badge variant="outline">{statusLabels[ticket.status]}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
