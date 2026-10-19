import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun';
import authRoutes from './routes/auth.js';
import ticketsRoutes from './routes/tickets.js';
import categoriesRoutes from './routes/categories.js';
import usersRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './lib/errors.js';
import { csrf } from './middleware/csrf.js';
import { initClassifier } from './ai/classify.js';
import type { UserPayload } from './lib/auth.js';

await initClassifier();

type Variables = {
  user: UserPayload;
};

const app = new Hono<{ Variables: Variables }>();

app.use(logger());
app.use('/api/*', csrf);
app.onError(errorHandler);
app.route('/api/auth', authRoutes);
app.route('/api/tickets', ticketsRoutes);
app.route('/api/categories', categoriesRoutes);
app.route('/api/users', usersRoutes);
app.route('/api/admin', adminRoutes);

app.get('/health', (c) => c.json({ ok: true }));

if (process.env.NODE_ENV === 'production') {
  // Static assets (JS/CSS from the Vite build)
  app.use('/assets/*', serveStatic({ root: './apps/web/dist' }));

  // SPA fallback: every non-API route returns the React app's index.html
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
