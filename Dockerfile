# syntax=docker/dockerfile:1
FROM oven/bun:1-slim AS base
WORKDIR /app

# Copy workspace manifests first for efficient layer caching
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile

# Copy source and build the web client
COPY . .
RUN bun run --cwd apps/web build

# Runtime stage
FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api ./apps/api
COPY --from=base /app/apps/web/dist ./apps/web/dist
COPY --from=base /app/packages ./packages
COPY --from=base /app/package.json ./
COPY --from=base /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
CMD ["/app/docker-entrypoint.sh"]
