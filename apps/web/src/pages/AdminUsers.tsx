import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

export function AdminUsers() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/api/users'),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.patch(`/api/users/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      {isLoading && <Spinner className="h-6 w-6" />}
      {!isLoading && (
        <div className="space-y-2">
          {data?.users?.map((u: any) => (
            <Card key={u.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">
                    {u.name} <span className="text-slate-400">({u.email})</span>
                  </div>
                  <div className="mt-1 flex gap-2">
                    <Badge variant="secondary">{u.role}</Badge>
                    <Badge variant={u.isActive ? 'success' : 'destructive'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={u.role}
                    onChange={(e) => update.mutate({ id: u.id, body: { role: e.target.value } })}
                  >
                    <option value="customer">Customer</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </Select>
                  <Button
                    variant={u.isActive ? 'outline' : 'secondary'}
                    onClick={() => update.mutate({ id: u.id, body: { isActive: !u.isActive } })}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
