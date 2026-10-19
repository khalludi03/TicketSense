import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-acceptance-rate'],
    queryFn: () => api.get('/api/admin/ai-acceptance-rate'),
  });

  const rate = data ? Math.round(data.rate * 100) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI suggestion acceptance rate</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <Spinner className="h-6 w-6" />}
          {!isLoading && (
            <div>
              <div className="text-3xl font-bold">{rate}%</div>
              <p className="text-sm text-slate-500">
                {data.accepted} accepted out of {data.total} decided suggestions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
