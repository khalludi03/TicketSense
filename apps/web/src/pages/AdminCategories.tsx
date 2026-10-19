import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export function AdminCategories() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories'),
  });

  const create = useMutation({
    mutationFn: (body: { name: string; description?: string }) => api.post('/api/categories', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setName('');
      setDescription('');
    },
  });

  const toggle = useMutation({
    mutationFn: (cat: any) => api.patch(`/api/categories/${cat.id}`, { isActive: !cat.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Categories</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add category</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button onClick={() => create.mutate({ name, description })} disabled={!name.trim()}>
            Add
          </Button>
        </CardContent>
      </Card>

      {isLoading && <Spinner className="h-6 w-6" />}
      {!isLoading && (
        <div className="space-y-2">
          {data?.categories?.map((cat: any) => (
            <Card key={cat.id}>
              <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">
                    {cat.name}{' '}
                    {!cat.isActive && (
                      <Badge variant="secondary" className="ml-2">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">{cat.description}</div>
                </div>
                <Button variant={cat.isActive ? 'outline' : 'secondary'} onClick={() => toggle.mutate(cat)}>
                  {cat.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
