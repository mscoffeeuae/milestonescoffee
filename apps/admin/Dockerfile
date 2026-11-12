# ── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/utilities/package.json ./packages/utilities/
COPY packages/config/package.json ./packages/config/
COPY packages/i18n/package.json ./packages/i18n/
COPY apps/admin/package.json ./apps/admin/

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/

WORKDIR /app/apps/admin
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS runner

LABEL org.opencontainers.image.title="milestones-admin"
LABEL org.opencontainers.image.description="Milestones Coffee 2.0 — Admin Dashboard"

RUN addgroup --system --gid 1001 milestones \
 && adduser --system --uid 1001 milestones

WORKDIR /app

COPY --from=builder --chown=milestones:milestones /app/apps/admin/.next/standalone ./
COPY --from=builder --chown=milestones:milestones /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder --chown=milestones:milestones /app/apps/admin/public ./apps/admin/public

USER milestones

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3001

CMD ["node", "apps/admin/server.js"]
