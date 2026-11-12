# ── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/utilities/package.json ./packages/utilities/
COPY packages/config/package.json ./packages/config/
COPY apps/worker/package.json ./apps/worker/

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/

WORKDIR /app/apps/worker
RUN pnpm run build

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS runner

LABEL org.opencontainers.image.title="milestones-worker"
LABEL org.opencontainers.image.description="Milestones Coffee 2.0 — Background Job Worker"

RUN addgroup --system --gid 1001 milestones \
 && adduser --system --uid 1001 milestones

WORKDIR /app

COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker/package.json ./

USER milestones

ENV NODE_ENV=production

# Worker does not expose an HTTP port; BullMQ pulls from Redis
CMD ["node", "dist/main.js"]
