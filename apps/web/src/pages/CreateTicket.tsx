import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createTicketSchema, type CreateTicketInput } from '@ticketsense/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, ApiError } from '@/lib/api';

export function CreateTicket() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketInput>({ resolver: zodResolver(createTicketSchema) });

  const onSubmit = async (data: CreateTicketInput) => {
    try {
      setError(null);
      const res = await api.post('/api/tickets', data);
      navigate(`/tickets/${res.ticket.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create ticket');
    }
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Create a support ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message as string}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={5} {...register('description')} />
              {errors.description && <p className="text-xs text-red-600">{errors.description.message as string}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create ticket'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
