# Architecture — Milestones Coffee 2.0

**Decision: Modular monolith.** Separate services only when measured scale or operational boundaries justify them.

---

## System overview

```
Customer/Staff browser
        │
        ▼
   Next.js (web / admin)          Sanity Studio
   App Router — SSR/RSC           Editorial CMS
        │                              │
        │ HTTPS /api/v1               │ GROQ
        ▼                              ▼
   NestJS API ◄─────── Sanity content client
        │
        ├── domain services (auth, catalog, cart, orders,
        │   payments, loyalty, gift-cards, promotions,
        │   corporate, integrations, notifications,
        │   reports, audit)
        │
        ├── PostgreSQL (Prisma)    ← operational source of truth
        │
        ├── Outbox dispatcher ─► BullMQ (Redis)
        │                              │
        │                        Worker process
        │                        (same domain code)
        │                              │
        │                        Provider adapters
        │                        (POS, payments, notifications,
        │                         identity, maps, media)
        │
        └── Redis (ephemeral cache — never financial authority)
```

---

## Runtime entry points

| App | Path | Purpose | DB access |
|---|---|---|---|
| `apps/web` | Customer website | Next.js App Router; calls API only | ✗ |
| `apps/admin` | Staff/HQ admin | Next.js App Router; calls API only | ✗ |
| `apps/api` | Business API | NestJS; owns all transactional rules | ✓ (Prisma) |
| `apps/worker` | Background jobs | Same domain modules; executes BullMQ handlers | ✓ (Prisma) |
| `apps/studio` | CMS editorial | Sanity Studio; content only | ✗ |

---

## Monorepo structure

```
milestones-platform/
├── apps/
│   ├── web/src/
│   │   ├── app/[locale]/
│   │   │   ├── (marketing)/
│   │   │   ├── (commerce)/
│   │   │   ├── (account)/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── i18n/
│   │   └── styles/
│   ├── admin/src/
│   │   ├── app/
│   │   ├── components/
│   │   └── features/
│   │       ├── dashboard/ branches/ catalog/ orders/
│   │       ├── customers/ loyalty/ gift-cards/
│   │       ├── promotions/ corporate/ reporting/
│   │       └── integrations/
│   ├── api/src/
│   │   ├── common/
│   │   ├── config/
│   │   ├── main.ts
│   │   └── modules/
│   │       ├── auth/ customers/ branches/ catalog/
│   │       ├── pricing/ cart/ orders/ payments/
│   │       ├── loyalty/ gift-cards/ promotions/
│   │       ├── corporate/ integrations/ notifications/
│   │       └── reports/ audit/
│   ├── worker/src/        # Same domain modules + job handlers
│   └── studio/            # Sanity schemas and editorial workflows
├── packages/
│   ├── ui/                # Accessible shared UI primitives
│   ├── contracts/         # OpenAPI definitions + generated clients
│   ├── database/
│   │   ├── prisma/        # Schema, migrations, dev seeds
│   │   └── generated/     # Generated Prisma client
│   ├── config/
│   ├── i18n/
│   └── utilities/
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   ├── monitoring/
│   └── deployment/
├── docs/                  # This directory
├── tests/
├── e2e/
├── integration/
├── .github/workflows/
├── .env.example
├── CLAUDE.md
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── README.md
```

---

## Dependency boundaries (enforced by ESLint/Turborepo)

| Package | May import | May NOT import |
|---|---|---|
| `apps/web` | `ui`, `contracts`, `i18n`, `utilities`, `config` | `database`, `api` modules directly |
| `apps/admin` | `ui`, `contracts`, `i18n`, `utilities`, `config` | `database`, `api` modules directly |
| `apps/api` | `database`, `contracts`, `utilities`, `config` | `ui`, frontend packages |
| `apps/worker` | `database`, `contracts`, `utilities`, `config` | `ui`, frontend packages |
| `packages/ui` | `utilities`, `config` | `database`, `contracts` |
| `packages/contracts` | `utilities` | `database`, `ui` |
| `packages/database` | `config`, `utilities` | `ui`, `contracts`, frontend |

**Critical rule:** Pricing and order state logic lives in backend domain services only. Shared frontend helpers must not contain transactional business logic.

---

## Data flow

```
Customer/admin request
  → versioned NestJS API (/api/v1)
  → domain service
  → PostgreSQL transaction + outbox event (atomic)
  → outbox dispatcher reads pending events
  → publishes jobs to BullMQ
  → worker process executes provider adapters
  → records outcomes (idempotency keys)

Provider webhooks:
  → verified signature + raw body
  → durable inbox (webhook_inbox)
  → inbox deduplication
  → valid state transitions only
  → retry with backoff; failure queue for exhausted work

Editorial reads:
  → public Next.js pages may read Sanity directly
  → controlled content client (read-only, no write tokens)
```

---

## Sources of truth

| Domain | Authority |
|---|---|
| Online orders and local ledgers | PostgreSQL |
| Marketing copy and editorial content | Sanity |
| Catalog fields, prices and stock counts | **TBD — POS or platform** (see DECISIONS.md D-003) |
| Customer identity | Managed auth provider (TBD) |
| Payment state | Payment gateway (reconciled with PostgreSQL) |

**Browser never supplies authoritative totals.** CMS prices cannot override the transactional catalog.

---

## Technology stack

| Layer | Technology | Version pin |
|---|---|---|
| Workspace | pnpm + Turborepo | TBD — see DECISIONS.md |
| Web/Admin | Next.js App Router + React + TypeScript | TBD |
| UI | Tailwind CSS + shadcn/ui + Motion | TBD |
| API | NestJS + REST + OpenAPI | TBD |
| Database | PostgreSQL + Prisma | TBD |
| CMS | Sanity | TBD |
| Cache/Jobs | Redis + BullMQ | TBD |
| Identity | **Provider TBD** | — |
| Media | S3-compatible storage | **Provider TBD** |
| Observability | Sentry + structured logs | TBD |
| Testing | Vitest or Jest + Playwright | TBD |
| CI/CD | GitHub Actions + Docker | TBD |

**Action required before Prompt 2:** Verify supported releases using official documentation and pin a tested Node + Next.js + NestJS + Prisma + PostgreSQL combination. Record in DECISIONS.md.

---

## Operational qualities

- **Availability:** Health checks, alerting, feature flags per branch
- **Recovery:** RPO ≤ 15 min, RTO ≤ 4 hours (proposed, subject to hosting capability and owner approval)
- **Concurrency:** Row locks or optimistic version checks for stock, capacity, points, gift balances
- **Idempotency:** Intent-persist-call-record pattern for all external provider interactions
- **Observability:** Sentry errors, structured logs (redacted), metrics, restore drills

---

## Configuration and developer workflow

- Validate all environment variables at startup
- `.env.example` contains names and safe descriptions only — no values
- Disposable local databases with clearly labeled fixtures
- CI runs: lint → type-check → schema generation → tests → builds (from lockfile)
- Review generated migrations before applying; never destructive-reset production
