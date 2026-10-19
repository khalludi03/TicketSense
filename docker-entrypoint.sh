#!/bin/sh
set -e

bun run db:migrate
exec bun run apps/api/src/index.ts
