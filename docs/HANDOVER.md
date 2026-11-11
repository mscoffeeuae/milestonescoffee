# Milestones Coffee 2.0 — Engineering Handover

> **Document type**: Final handover — covers all 12 build prompts  
> **Status**: Platform scaffold complete; production-ready pending business inputs below  
> **Prepared by**: Claude Code (Claude Sonnet 4.6)  
> **Date**: 2026-11-11

---

## What was built

Milestones Coffee 2.0 is a **modular monolith** digital platform for a UAE specialty
coffee brand. All code lives in a single pnpm/Turborepo monorepo at
`/home/claude/milestones-platform`.

### Runtime services

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `apps/api` | `milestones/api` | 4000 | NestJS 12 (ESM) business API |
| `apps/web` | `milestones/web` | 3000 | Next.js 16 customer-facing site (en/ar) |
| `apps/admin` | `milestones/admin` | 3001 | Next.js 16 staff dashboard |
| `apps/worker` | `milestones/worker` | — | BullMQ background job processor |
| `apps/studio` | `milestones/studio` | 3333 | Sanity CMS editorial interface |
| `postgres` | `postgres:17-alpine` | 5432 | Primary database |
| `redis` | `redis:7-alpine` | 6379 | Cache + BullMQ queue |

### Shared packages

| Package | Purpose |
|---------|---------|
| `packages/database` | Prisma 7 schema + generated client stub + migrations |
| `packages/contracts` | Zod schemas shared between API and frontend |
| `packages/ui` | shadcn/ui component library with Tailwind |
| `packages/i18n` | Arabic/English translation dictionaries |
| `packages/config` | Environment variable loaders |
| `packages/utilities` | Shared helper functions |

---

## What each prompt built

| Prompt | Deliverable |
|--------|-------------|
| 1 | Facts register, architecture decision, monorepo scaffold, pnpm/Turborepo wiring |
| 2 | Shared packages (database, contracts, ui, i18n, config, utilities), ESLint/TS config |
| 3 | Design system — Tailwind tokens, shadcn/ui setup, Motion, RTL layout scaffolding |
| 4 | Sanity CMS — schemas for Menu, Branch, Promotions, Blog, Gallery, Staff Picks |
| 5 | Full Prisma schema — all Phase 1–3 models (60+ tables), `@@unique` / money / UTC conventions |
| 6 | NestJS API scaffold — module structure, auth guards, rate limiting, OpenAPI, health endpoint |
| 7 | Menu, Branch, and CMS-sync domain modules |
| 8 | Cart, Orders, Payments, POS integration stubs (D-005/D-006 pending) |
| 9 | Accounts, Loyalty, Gift Cards, Corporate portal, Shop domain modules |
| 10 | Staff tools, Notifications, Admin reporting endpoints |
| 11 | Feature flags, QR codes, Subscriptions, Recommendation engine (D-011/D-012/D-013 stubs) |
| 12 | Dockerfiles × 4, docker-compose.prod.yml, enhanced CI (migration-check + Docker build), complete RUNBOOKS.md, this HANDOVER.md |

---

## Decisions made (locked)

See `docs/DECISIONS.md` for the full register. Key locked choices:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Modular monolith | Single-team, predictable ops, later extraction if needed |
| Money | Integer fils (1 AED = 100 fils) | Eliminates float rounding; column suffix `...Fils` |
| Time | UTC in DB (`@db.Timestamptz`), Asia/Dubai for display | Avoids DST ambiguity |
| TypeScript | TS 7, `moduleResolution: NodeNext`, `exactOptionalPropertyTypes: true` | Strictest safe types |
| NestJS | ESM (`"type":"module"` in api package.json), dist/main.js entry | Required for NestJS 12 |
| Auth | JWT (access + refresh); staff MFA; customer OTP — **provider TBD (D-004)** | Framework set; provider unresolved |
| Feature flags | Per-branch `BranchFeatureFlag` table; default-off | Safe rollout gate |
| Idempotency | All mutating API ops require `Idempotency-Key` header; `@@unique` DB constraints | Prevents double-charges |
| Optimistic concurrency | `version` field on Cart and InventoryItem | Prevents silent overwrites |
| Privacy | IP hashing (SHA-256); raw IPs never stored | PDPL compliance |
| Prisma stub | Hand-maintained `packages/database/src/generated/index.ts` stub | Prisma binary unavailable in build sandbox |

---

## Open stubs (must be resolved before launch)

| Stub ID | Location | Description | Blocks |
|---------|----------|-------------|--------|
| D-004 | `docs/DECISIONS.md` | Identity provider (OTP for customers, MFA for staff) | All auth |
| D-005 | `apps/api/src/payments/` | Payment gateway (Stripe/Telr/Checkout.com adapter) | Checkout, Phase 2 |
| D-006 | `apps/api/src/pos/` | POS vendor + API contract | Phase 2 dispatch |
| D-007 | `docs/FACTS_REGISTER.md` | Hosting provider + region | Deployment |
| D-008 | `apps/api/src/notifications/` | Email provider (SendGrid/Resend/SES adapter) | Customer comms |
| D-009 | `apps/api/src/loyalty/loyalty.service.ts` | Loyalty earn/burn/tier rule implementation | Phase 3 rewards |
| D-010 | `docs/FACTS_REGISTER.md` | Verified branch register (addresses, coordinates) | Phase 1 go-live |
| D-011 | `apps/api/src/subscriptions/subscription.service.ts` | Subscription plan definitions (durations, prices, perks) | Phase 3 subscriptions |
| D-012 | `apps/worker/src/` | Recurring billing worker (triggered on nextBillingAt) | Phase 3 subscriptions |
| D-013 | `apps/api/src/recommendations/recommendation.service.ts` | Collaborative filtering (currently popularity-based stub) | Phase 3 recommendations |

---

## Launch gates — what must be true before each phase goes live

### Phase 1 (Customer website + CMS)

- [ ] D-004 identity provider chosen and wired (customer OTP minimum)
- [ ] D-010 branch register verified (real addresses, real coordinates, real hours)
- [ ] Brand kit delivered by Marketing (logo, colors, fonts) → Tailwind tokens updated
- [ ] Bilingual copy approved by Marketing → Sanity content populated
- [ ] Privacy/legal review completed → Cookie consent, Terms, Privacy Policy pages live
- [ ] D-007 hosting provider confirmed → DNS, TLS, CDN configured

### Phase 2 (Ordering + Payments)

- [ ] D-005 payment gateway integrated and reconciled in staging
- [ ] D-006 POS vendor API access provisioned and tested
- [ ] Tax policy confirmed by Finance (inclusive/exclusive, rate) → checkout totals correct
- [ ] Idempotency key smoke test: place same order twice → second returns 409
- [ ] Pilot payment reconciliation: 100 real transactions, zero duplicates

### Phase 3 (Rewards + QR + Subscriptions + Recommendations)

- [ ] D-009 loyalty rules approved by Finance + Marketing
- [ ] D-011 subscription plan definitions agreed (prices, durations, perks)
- [ ] D-012 recurring billing worker built, tested, and audited
- [ ] UAE consumer protection review: `recurringConsent` flow approved by Legal
- [ ] D-013 (or decision to stay on popularity stub) reviewed by Product
- [ ] Feature flags enabled per branch after per-branch UAT

---

## Infrastructure not set up (intentionally deferred)

| Item | Status | Notes |
|------|--------|-------|
| Hosting provider | TBD (D-007) | Cloud provider and region not chosen |
| DNS / TLS / CDN | Not configured | Depends on D-007 |
| Managed PostgreSQL | Not configured | Use managed DB (not Docker) in production |
| Object storage (S3) | Env vars wired; bucket not created | For menu images, receipts, QR exports |
| Sentry project | Env vars wired; project not created | DSN needed |
| Reverse proxy | Not configured | nginx/Caddy/Traefik — owner to set up |
| Monitoring/alerting | Thresholds documented in RUNBOOKS.md R-07 | Tool not chosen |
| CI/CD deploy step | Placeholder in `staging-gate` job | Replace with actual deploy command |

---

## Security controls in place

| Control | Implementation |
|---------|---------------|
| JWT auth (access + refresh) | `apps/api/src/common/guards/jwt-auth.guard.ts` |
| Role-based access | `apps/api/src/common/guards/roles.guard.ts`; roles: CUSTOMER, STAFF, MANAGER, HQ |
| Rate limiting | `@nestjs/throttler` at module level; stricter on auth endpoints |
| Idempotency | Middleware checks `Idempotency-Key` header on mutating routes |
| IP privacy | SHA-256 hash stored in `QrCodeScanLog.ipHash`; raw IP never persisted |
| Optimistic concurrency | `version` field on Cart + InventoryItem — prevents silent overwrites |
| Feature flags | Per-branch; all Phase 2+ features default-off |
| No secrets in code | All credentials via env vars; `.env` files in `.gitignore` |
| CORS | Configured via `CORS_ORIGINS` env var |
| Subscription consent | `recurringConsent: true` enforced at service layer |

---

## Development workflow

```bash
# Install
pnpm install

# Start infrastructure
docker compose up -d

# Start all dev servers (hot reload)
pnpm dev

# Run tests
pnpm test

# Type-check all packages
pnpm typecheck

# Lint
pnpm lint

# Apply DB migrations
pnpm db:migrate

# Seed dev data
pnpm db:seed
```

---

## Key architectural constraints to preserve

1. **`web` and `admin` must NEVER import `packages/database`** — only `api` and `worker` may.
2. **Money is always integer fils** — never `float`, never `Decimal` for AED amounts.
3. **All DB timestamps are UTC** (`@db.Timestamptz`) — convert to Asia/Dubai only at display time.
4. **Feature flags are the rollout gate** — a new feature must be behind a flag before deploy.
5. **Idempotency keys are required** on all order/payment mutation endpoints.
6. **Prisma generated client is a stub** — do not run `prisma generate` until the binary issue is resolved; update `packages/database/src/generated/index.ts` by hand instead.
7. **NestJS 12 is ESM** — `import` paths in `apps/api` must end in `.js`; `tsconfig` must use `NodeNext`.

---

## Files to read first (new team member orientation)

1. `CLAUDE.md` — session context, safety rules, architecture overview
2. `docs/FACTS_REGISTER.md` — verified business facts
3. `docs/DECISIONS.md` — all architecture decisions and their rationale
4. `docs/DATABASE.md` — schema conventions, money/time rules
5. `docs/SECURITY.md` — roles, controls, PDPL notes
6. `docs/RUNBOOKS.md` — operational procedures

---

*This document covers the full scope of the Milestones Coffee 2.0 platform scaffold as
delivered across 12 build prompts. The platform is structurally complete and all
placeholder/stub points are explicitly documented above. No invented business data was
used anywhere in the codebase.*
