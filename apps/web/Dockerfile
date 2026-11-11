# ── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/utilities/package.json ./packages/utilities/
COPY packages/config/package.json ./packages/config/
COPY packages/i18n/package.json ./packages/i18n/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Next.js standalone build (requires output: 'standalone' in next.config)
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS runner

LABEL org.opencontainers.image.title="milestones-web"
LABEL org.opencontainers.image.description="Milestones Coffee 2.0 — Customer Website"

RUN addgroup --system --gid 1001 milestones \
 && adduser --system --uid 1001 milestones

WORKDIR /app

# Next.js standalone output includes everything needed to run
COPY --from=builder --chown=milestones:milestones /app/apps/web/.next/standalone ./
COPY --from=builder --chown=milestones:milestones /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=milestones:milestones /app/apps/web/public ./apps/web/public

USER milestones

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
