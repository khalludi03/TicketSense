export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function request(method: string, url: string, body?: unknown) {
  const opts: RequestInit = {
    method,
    credentials: 'include',
    headers: {},
  };

  if (body !== undefined) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);
  const data = res.status === 204 ? null : await res.json();

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error?.code ?? 'UNKNOWN',
      data?.error?.message ?? 'Request failed',
      data?.error?.details,
    );
  }

  return data;
}

export const api = {
  get: (url: string) => request('GET', url),
  post: (url: string, body: unknown) => request('POST', url, body),
  patch: (url: string, body: unknown) => request('PATCH', url, body),
  delete: (url: string) => request('DELETE', url),
};

export function getFieldError(details: unknown, field: string): string | undefined {
  if (!Array.isArray(details)) return undefined;
  const issue = details.find((d) => d.path?.[0] === field);
  return issue?.message;
}
