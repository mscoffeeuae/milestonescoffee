# Deployment — Milestones Coffee 2.0

---

## Environments

| Environment | Purpose | Data | Secrets |
|---|---|---|---|
| `development` | Local developer machines | Disposable fixtures; labeled test data | Local `.env` only; never production values |
| `staging` | Pre-release integration and QA | Anonymized test data; no real customer data | Staging-specific secrets |
| `production` | Live customer-facing | Real data; backups required | Secret manager only |

**Rule:** Separate identities, credentials and databases for each environment. Never share production credentials with staging or development.

---

## CI/CD pipeline (target)

```
git push → GitHub Actions
  ├── lint (pnpm lint)
  ├── type-check (pnpm type-check)
  ├── schema generation (prisma generate)
  ├── unit tests (pnpm test)
  ├── integration tests (requires test DB)
  ├── build (pnpm build)
  └── on main: build Docker image → push to registry → deploy to staging
                                                  → (manual gate) deploy to production
```

**Rules:**
- All steps must pass from the lockfile (`--frozen-lockfile`)
- Review generated Prisma migrations before applying
- Never run destructive reset commands (`prisma migrate reset`) against production
- Production deploy requires passing staging health check and human approval

---

## Docker and containerization

Each app builds to its own image:

| Image | App | Notes |
|---|---|---|
| `milestones/web` | `apps/web` | Next.js standalone output |
| `milestones/admin` | `apps/admin` | Next.js standalone output |
| `milestones/api` | `apps/api` | NestJS; runs migrations on start |
| `milestones/worker` | `apps/worker` | BullMQ worker; no external port |
| `milestones/studio` | `apps/studio` | Sanity Studio; optional self-hosted |

External services (PostgreSQL, Redis): use managed hosting services, not containers in production.

---

## Hosting (TBD — awaiting Engineering + Privacy reviewer decision)

**Decisions required:**
- Hosting provider and region
- Data residency requirements (UAE privacy requirements)
- Managed PostgreSQL provider
- Managed Redis provider
- S3-compatible object storage provider
- CDN provider

**Proposed recovery objectives** (subject to hosting capability and owner approval):
- RPO ≤ 15 minutes
- RTO ≤ 4 hours

---

## Database migration strategy

1. All migrations in `packages/database/prisma/migrations/`
2. Every migration reviewed before applying
3. Migrations must be idempotent where possible
4. For breaking changes: deploy backward-compatible migration first, then update application, then clean up
5. Rollback strategy: document forward-repair path for each migration; note which migrations cannot be rolled back without data loss
6. Never apply migrations to production without first running on staging

---

## Environment variable management

- `.env.example`: names and descriptions only; no values; committed to repository
- `.env.local`: developer machines; never committed
- Staging/production: injected from secret manager at runtime
- Validation: all required environment variables validated at application startup (fail fast)

---

## Health checks

| App | Health endpoint | Check |
|---|---|---|
| `api` | `GET /health` | DB connectivity, Redis connectivity, job queue status |
| `web` | `GET /api/health` | Upstream API reachability |
| `admin` | `GET /api/health` | Upstream API reachability |
| `worker` | Internal metric | Queue depth, error rate, last processed |

---

## Feature flags

Feature flags control per-branch enablement:

| Feature | Flag key | Phase |
|---|---|---|
| Pickup ordering | `feature.ordering.{branchId}` | 2 |
| Gift cards | `feature.giftCards` | 2 |
| Retail shipping | `feature.retailShipping` | 3 |
| Rewards program | `feature.loyalty` | 3 |
| Subscriptions | `feature.subscriptions` | 3 |
| QR ordering | `feature.qrOrdering.{branchId}` | 3 |

Unavailable features must not appear as active navigation items.

---

## Release process

1. Build and test in CI
2. Deploy to staging
3. Run smoke tests and acceptance checks on staging
4. Manual review and approval gate
5. Deploy to production (initially: single branch pilot)
6. Monitor logs, error rates, payment reconciliation for defined observation period
7. Gradual rollout to additional branches

**Pause criteria:**
- Missing orders (not received by staff)
- Payment mismatches (charged without order, or order without charge)
- Serious access-control defect (data crossing customer/branch boundaries)
- Unacceptable checkout failure rate

**Rollback:**
- Disable feature flag for affected branch first
- Financial records must be preserved during rollback
- Use compatible migrations; forward repair where rollback would lose data

---

## Backups and disaster recovery

- Automated database backups (frequency TBD pending hosting provider)
- Point-in-time recovery where supported by hosting provider
- Backup restore drill: schedule and document results
- Incident runbooks: in `docs/RUNBOOKS.md`
- After recovery: rehearse payment reconciliation to verify financial integrity

---

## Monitoring and alerting

| Signal | Tool | Owner |
|---|---|---|
| Application errors | Sentry | Engineering |
| Structured logs | Hosting provider log service | Engineering |
| Uptime | External health check | Engineering |
| Payment reconciliation | Custom reconciliation reports | Finance |
| POS dispatch failures | Integration health dashboard | Operations |
| Queue depth / worker errors | BullMQ metrics | Engineering |
| Performance (p75 LCP/INP/CLS) | Real user monitoring | Engineering |

Configure alerting thresholds and escalation paths before production launch. Assign named owners to each alert category.

---

## Open deployment decisions (see DECISIONS.md)

| Decision | Owner |
|---|---|
| Hosting provider and region | Engineering + Privacy reviewer |
| Managed DB provider | Engineering |
| CDN and media delivery | Engineering |
| Secret manager choice | Engineering |
| Backup frequency and retention | Engineering + Privacy reviewer |
| RPO/RTO achievability | Engineering + Hosting provider |
