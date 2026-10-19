# TicketSense

AI-assisted support ticket triage desk. Customers create tickets, agents resolve them, and admins manage users and categories. A self-built TF-IDF + logistic regression classifier suggests category and priority every time a ticket is created.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Bun + Hono + TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **AI:** From-scratch TF-IDF + one-vs-rest logistic regression (pure TypeScript)
- **Testing:** `bun test`
- **Deployment:** Render (Docker)

## Setup

```bash
bun install
cp .env.example .env
# Fill in DATABASE_URL (Neon pooled endpoint) and ALLOWED_ORIGINS
bun run db:migrate
bun run db:seed
bun run db:train   # regenerates packages/shared/model/model.json if you edit the fixture
bun run dev:api    # port 3000
bun run dev:web    # port 5173
```

## Environment variables

```env
DATABASE_URL=postgresql://user:pass@ep-....neon.tech:5432/neondb?sslmode=require
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.onrender.com
NODE_ENV=development
PORT=3000
```

## Tests

```bash
bun test
```

## Demo credentials

| Role | Email | Password |
| --- | --- | --- |
| Customer | jashim@example.com | password123 |
| Customer | nusrat@example.com | password123 |
| Customer | shirin@example.com | password123 |
| Agent | bullet@example.com | password123 |
| Admin | rafiq@example.com | password123 |

## Notes

- Auth pages (`/login`, `/signup`) use shadcn-style CSS variables and support light/dark/system themes. Older app components still use hardcoded Tailwind colors and will be migrated in a future pass.

## Deploy

1. Create a Neon PostgreSQL project and copy the **pooled** `DATABASE_URL`.
2. In Render, create a new Web Service from this repo and use the included `Dockerfile`.
3. Set `DATABASE_URL` and `ALLOWED_ORIGINS` in the Render dashboard.
4. Render runs migrations on startup via `docker-entrypoint.sh` before starting the server.

Alternatively, use the included `render.yaml` Blueprint.

## AI evaluation

Trained on 96 hand-written examples with a deterministic 80/20 split (seed 42).

- **Category accuracy:** 55.0%
- **Priority accuracy:** 65.0%

### Category confusion matrix

```
           Billing   Technical   Account   General
Billing          3           0         0         0
Technical        1           3         1         2
Account          0           1         3         1
General          1           1         1         2
```

### Priority confusion matrix

```
        low   medium   high
low       5        3      0
medium    1        2      1
high      0        2      6
```

## Limitations

- Small, hand-written training set — the classifier will not generalize well to very different phrasing or other languages.
- No retraining pipeline in the MVP; agent accept/override decisions are logged in `ai_suggestions` for future use.
- Priority prediction is subjective and always overridable.
- Render free tier sleeps after inactivity — warm up the URL a few minutes before a live demo.
