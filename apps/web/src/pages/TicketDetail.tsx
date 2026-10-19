import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

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

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const isStaff = user?.role === 'agent' || user?.role === 'admin';

  const { data, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => api.get(`/api/tickets/${id}`),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ticket', id] });

  const statusMutation = useMutation({
    mutationFn: (body: { status: string; resolutionNote?: string }) => api.patch(`/api/tickets/${id}/status`, body),
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: () => api.patch(`/api/tickets/${id}/assign`, {}),
    onSuccess: invalidate,
  });

  const commentMutation = useMutation({
    mutationFn: (body: { body: string }) => api.post(`/api/tickets/${id}/comments`, body),
    onSuccess: () => {
      invalidate();
      setComment('');
    },
  });

  const suggestionMutation = useMutation({
    mutationFn: (body: { accept: boolean; categoryId?: number; priority?: string }) =>
      api.patch(`/api/tickets/${id}/suggestion`, body),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <div className="py-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) return <div className="text-red-600">Failed to load ticket</div>;
  if (!data) return <div>Ticket not found</div>;

  const { ticket, category, customer, agent, comments, aiSuggestion } = data;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{ticket.title}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-500">
            <span>By {customer?.name}</span>
            <span>·</span>
            <span>{category?.name}</span>
            <span>·</span>
            <span>{new Date(ticket.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={priorityColors[ticket.priority as keyof typeof priorityColors] ?? 'default'}>
            {ticket.priority}
          </Badge>
          <Badge variant="outline">{statusLabels[ticket.status]}</Badge>
        </div>
      </div>

      {agent && <div className="text-sm text-slate-600">Assigned to: {agent.name}</div>}

      <Card>
        <CardContent className="pt-6">
          <p className="whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      {isStaff && aiSuggestion && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <span className="font-medium">AI suggestion:</span>{' '}
                {category?.name} · {aiSuggestion.suggestedPriority} (
                {Math.round(aiSuggestion.confidence * 100)}% confidence)
                {aiSuggestion.wasAccepted === true && (
                  <Badge variant="success" className="ml-2">
                    Accepted
                  </Badge>
                )}
                {aiSuggestion.wasAccepted === false && (
                  <Badge variant="secondary" className="ml-2">
                    Overridden
                  </Badge>
                )}
              </div>
              {aiSuggestion.wasAccepted === null && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => suggestionMutation.mutate({ accept: true })}>
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      suggestionMutation.mutate({
                        accept: false,
                        categoryId: ticket.categoryId,
                        priority: aiSuggestion.suggestedPriority,
                      })
                    }
                  >
                    Keep suggested
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isStaff && ticket.status !== 'closed' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ticket.status === 'open' && (
              <Button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending}>
                Assign to me
              </Button>
            )}
            {ticket.status === 'in_progress' && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Resolution note"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
                <Button
                  onClick={() => statusMutation.mutate({ status: 'resolved', resolutionNote })}
                  disabled={statusMutation.isPending || !resolutionNote.trim()}
                >
                  Resolve
                </Button>
              </div>
            )}
            {ticket.status === 'resolved' && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => statusMutation.mutate({ status: 'open' })} disabled={statusMutation.isPending}>
                  Reopen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => statusMutation.mutate({ status: 'closed' })}
                  disabled={statusMutation.isPending}
                >
                  Close
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments?.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
          {comments?.map((c: any) => (
            <div key={c.id} className="border-b pb-3 last:border-0">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{c.author.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {c.author.role}
                </Badge>
                <span className="text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
            </div>
          ))}
          {ticket.status !== 'closed' && (
            <div className="space-y-2">
              <Textarea placeholder="Add a comment" value={comment} onChange={(e) => setComment(e.target.value)} />
              <Button
                onClick={() => commentMutation.mutate({ body: comment })}
                disabled={commentMutation.isPending || !comment.trim()}
              >
                Comment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
