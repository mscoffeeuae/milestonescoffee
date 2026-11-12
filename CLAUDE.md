# Milestones Coffee 2.0 — CLAUDE.md

**Master context for all Claude Code sessions on this repository.**
Read this file at the start of every session before making any change.

---

## Project identity

| Field | Value |
|---|---|
| Project | Milestones Coffee 2.0 — Option C Complete Digital Coffee Platform |
| Brief | `docs/PRD.md` and all files under `docs/` |
| Status | **Prompt 12 complete — ALL 12 PROMPTS DELIVERED — Platform scaffold complete** |
| Current phase | Phase 1 preparation (pending business inputs — see docs/HANDOVER.md) |
| Next increment | Production deployment (requires D-004 through D-010 resolved) |

---

## Architecture decision (locked)

**Modular monolith** with four runtime entry points:

| App | Purpose |
|---|---|
| `apps/web` | Customer-facing Next.js website (bilingual en/ar) |
| `apps/admin` | Protected staff and HQ administration app |
| `apps/api` | NestJS business API — all transactional rules |
| `apps/worker` | Background jobs via BullMQ — same domain modules |
| `apps/studio` | Sanity CMS editorial workflows |

Shared packages: `ui`, `contracts`, `database`, `config`, `i18n`, `utilities`.

**Dependency boundary (enforced):**
- `web` and `admin` → `ui`, `contracts`, `i18n`, `utilities`, `config` only
- Only `api` and `worker` may import `database`
- Pricing and order state logic lives in backend domain services only

---

## Technology stack (versions DECIDED — see docs/DECISIONS.md)

| Layer | Technology | Notes |
|---|---|---|
| Workspace | pnpm + Turborepo | Shared lockfile |
| Web/Admin | Next.js 16.4.6 + React 19.3.1 + TypeScript 7.0.2 | ✅ Pinned |
| UI | Tailwind + shadcn/ui + Motion | Prompt 3 |
| API | NestJS 12.4.2 + REST + OpenAPI | ✅ Scaffolded |
| Database | PostgreSQL 17 + Prisma 7.10.1 | Prompt 5 (full schema) |
| CMS | Sanity 6.23.0 | Prompt 4 (schemas) |
| Cache/Jobs | Redis 7 + BullMQ 6.7.4 | Never financial authority |
| Identity | **TBD — see DECISIONS.md D-004** | Customer OTP + Staff MFA |
| Media | S3-compatible object storage | **Provider TBD** |
| Observability | Sentry + structured logs | ✅ Env vars wired |
| Monorepo | pnpm 10.28.0 + Turborepo 2.11.10 | ✅ Configured |

---

## Delivery phases

| Phase | Scope | Gate |
|---|---|---|
| Discovery | Facts, decisions, architecture, compatibility | Approved facts register + decisions |
| Phase 1 | Bilingual website, CMS, menu, branches, corporate enquiries, SEO | Content approved, redirects verified |
| Phase 2 | Accounts, cart, ordering, payments, POS, staff tools, shop, gift cards | Pilot payments reconciled, no duplicates |
| Phase 3 | Rewards, corporate portal, QR, subscriptions, recommendations | Approved program rules, ledger reconciled |
| Rollout | Gradual branch expansion | Runbooks accepted |

---

## Safety rules (non-negotiable)

1. **No invented business data.** Never invent branch addresses, prices, allergens, reviews, SKUs or brand claims.
2. **No live secrets in code.** All credentials via secret manager or `.env` (never committed). `.env.example` contains names only.
3. **Money in integer fils only.** Never use floating-point for AED amounts.
4. **UTC instants; Asia/Dubai for display.** Never store local times as UTC.
5. **CMS prices never override transactional catalog.**
6. **Mocks must be explicitly labeled.** A mock adapter cannot be selected by production configuration.
7. **No production resets.** Never run destructive development reset commands against production databases.
8. **Feature flags for unready features.** Ordering, gift cards, rewards, shipping, subscriptions all require explicit enablement per branch.
9. **No VPS destructive commands without verification.** (See user preferences.)
10. **Read all files before changing anything.** Understand full architecture first.

---

## Unresolved business inputs (block dependent features)

See `docs/DECISIONS.md` for the full decision register.

| Input | Owner | Blocks |
|---|---|---|
| POS vendor + API access | Operations | Phase 2 dispatch |
| Payment gateway | Finance | Checkout pilot |
| Identity provider (OTP + MFA) | Engineering | Auth, accounts |
| Branch register (verified) | Operations | Phase 1 locations |
| Menu, SKUs, allergens | Operations | Phase 1 menu |
| Tax policy (inclusive/exclusive, rate) | Finance | Checkout totals |
| Loyalty rules (earn rate, expiry, tiers) | Finance + Marketing | Phase 3 |
| Brand kit (logo, fonts, colors) | Marketing | Phase 1 UI |
| Bilingual copy (approved) | Marketing | Phase 1 content |
| Hosting provider + region | Engineering | Deployment |
| Privacy/legal review | Designated reviewer | Customer-facing launch |

---

## Documentation index

| File | Purpose |
|---|---|
| `docs/PRD.md` | Product requirements, goals, scope |
| `docs/FACTS_REGISTER.md` | Verified facts, sources, owners |
| `docs/SITEMAP.md` | All routes, phases, purposes |
| `docs/ARCHITECTURE.md` | System design, boundaries, data flow |
| `docs/DATABASE.md` | Full Prisma schema reference, conventions |
| `docs/API.md` | REST surface, contracts, auth |
| `docs/DESIGN_SYSTEM.md` | Visual direction, components, tokens |
| `docs/SECURITY.md` | Roles, controls, privacy |
| `docs/INTEGRATIONS.md` | Provider contracts, adapter design |
| `docs/DEPLOYMENT.md` | CI/CD, environments, recovery |
| `docs/DECISIONS.md` | Architecture decisions, version pins |
| `docs/IMPLEMENTATION_PLAN.md` | Phase gates, test plan |
| `docs/RUNBOOKS.md` | Operational procedures |

---

## Git and CI conventions

- Branch naming: `feat/prompt-N-description`, `fix/scope-description`
- Every increment: code + tests + migration review + updated docs + handoff summary
- CI runs: lint, type-check, schema generation, tests, build — all from lockfile
- Review generated migrations before applying; never destructive-reset production

---

*This file is the source of truth for session context. Update it at each prompt gate.*
