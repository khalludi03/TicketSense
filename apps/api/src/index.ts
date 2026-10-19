import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun';

const app = new Hono();

app.use(logger());

app.get('/health', (c) => c.json({ ok: true }));

if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './apps/web/dist' }));

  app.get('*', async () => {
    const file = Bun.file('./apps/web/dist/index.html');
    return new Response(file);
  });
}

const port = Number(process.env.PORT) || 3000;

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`API server running on port ${port}`);
