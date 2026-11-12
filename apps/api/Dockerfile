# ── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

# Copy workspace manifests (layer-cached before source)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/utilities/package.json ./packages/utilities/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

# Install ALL workspace dependencies (locked)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build
WORKDIR /app/apps/api
RUN pnpm run build

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS runner

LABEL org.opencontainers.image.title="milestones-api"
LABEL org.opencontainers.image.description="Milestones Coffee 2.0 — NestJS API"

# Non-root user
RUN addgroup --system --gid 1001 milestones \
 && adduser --system --uid 1001 milestones

WORKDIR /app

# Copy built output and runtime dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./

# Prisma schema (needed for migrate deploy on startup)
COPY packages/database/prisma ./prisma

USER milestones

ENV NODE_ENV=production
EXPOSE 4000

# Run migrations then start (migration idempotent; safe on each deploy)
CMD ["sh", "-c", "node node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma && node dist/main.js"]
