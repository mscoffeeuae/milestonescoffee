# Implementation Plan — Milestones Coffee 2.0

---

## Delivery model

12 sequential increments (prompts). Each increment is verified before the next begins. Features dependent on missing decisions remain disabled.

---

## Phase gates

### Discovery gate (before Prompt 2)
- [ ] All planning documents created and reviewed
- [ ] Version pins decided (D-V-001 to D-V-010 in DECISIONS.md)
- [ ] Hosting environment identified (or development-only baseline established)
- [ ] Identity provider shortlisted (D-004)
- [ ] FACTS_REGISTER.md baseline captured

### Phase 1 gate (after Prompt 4)
- [ ] Bilingual (en + ar) website renders correctly on mobile and desktop
- [ ] Arabic RTL and direction reviewed by native speaker
- [ ] All public Phase 1 pages render with approved content (or clearly marked placeholders)
- [ ] Branch list displays verified branch data (or labeled test data)
- [ ] Menu displays verified catalog data (or labeled test data)
- [ ] Corporate enquiry forms submit and route correctly
- [ ] Redirect map reviewed; legacy URLs redirect correctly
- [ ] Public pages indexed; private/admin pages excluded from sitemap
- [ ] Keyboard navigation and screen reader basic check pass
- [ ] No unresolved blocking accessibility issues
- [ ] CI pipeline passes (lint, type-check, build, tests)
- [ ] Sentry and analytics configured (staging confirmed)
- [ ] Content sign-off from Marketing

### Phase 2 gate (after Prompt 9)
- [ ] Identity provider integrated; customer OTP flow working end-to-end
- [ ] Staff auth and MFA working
- [ ] Checkout quote: server computes correct totals for all variants, modifiers and promotions
- [ ] Idempotent order creation: duplicate requests produce one order
- [ ] Payment integration: webhook replay, timeout and reconciliation integration tests pass
- [ ] POS integration: order dispatch, acknowledgement and reconciliation tested in pilot
- [ ] Gift card: issuance, delivery, balance lookup and redemption tested
- [ ] Concurrency tests: last item, capacity and coupon cannot be overspent
- [ ] Order recovery: paid-but-unfulfillable path demonstrated
- [ ] Refund workflow: authorized, bounded, provider-reconciled
- [ ] Branch staff trained
- [ ] Finance sign-off on payment reconciliation
- [ ] No duplicate fulfillment demonstrated in pilot

### Phase 3 gate (after Prompt 10)
- [ ] Loyalty rules approved and published
- [ ] Ledger reconciliation report clean
- [ ] Redemption concurrency tested (points cannot be double-spent)
- [ ] Corporate portal tested end-to-end (enquiry → quote → acceptance)
- [ ] Opt-in controls and consent withdrawal tested
- [ ] All program rules approved by Finance and Marketing

### Release gate (after Prompt 12)
- [ ] Full acceptance criteria evidence (see PRD.md)
- [ ] English + Arabic, keyboard, screen reader review documented
- [ ] Ownership and branch isolation negative tests pass
- [ ] Payment replay, ledger concurrency and reconciliation tests pass
- [ ] Redirects, sitemaps and analytics validated
- [ ] Performance: lab evidence documented; field monitoring configured
- [ ] Secret management verified; no secrets in code or logs
- [ ] Dependency vulnerability scan clean
- [ ] Migration safety verified
- [ ] Backup restoration tested and timed
- [ ] Staging deployment working
- [ ] Per-branch feature flags configured
- [ ] Rollback instructions documented
- [ ] Incident runbooks complete
- [ ] Named operational owners assigned
- [ ] Business sign-offs recorded

---

## 12-prompt sequence

| Prompt | Scope | Key outputs | Gate |
|---|---|---|---|
| 1 | Discovery and implementation contract | CLAUDE.md + all docs/ | Planning docs reviewed |
| 2 | Workspace and delivery foundation | Monorepo scaffold, CI, dev env | Install + lint + type-check + build pass |
| 3 | Bilingual design system and public shell | Design system, homepage shell, component library | Mobile/desktop, keyboard, language switching tests pass |
| 4 | Editorial content and public discovery | Sanity schemas, Phase 1 pages, branch locator, SEO | Publishing, cache, map fallback, form failure tests pass |
| 5 | Database identity and authorization | Complete Prisma schema, identity integration, auth middleware | Schema validation, client gen, migration, negative auth tests pass |
| 6 | Branch catalog cart and pricing | Catalog API, cart, checkout quotes, pricing engine | Pricing, modifier, concurrency tests pass; OpenAPI generated |
| 7 | Checkout payments and refunds | Order creation, payment intents, webhooks, refunds | Duplicate payment, replay, refund reconciliation tests pass |
| 8 | Branch operations POS and notifications | Order management UI, POS adapter, notifications, outbox | POS pilot, duplicate job, disconnected POS tests pass |
| 9 | Retail shop gift cards and customer account | Customer profile, shop, gift cards, PWA caching | Gift card, concurrent redemption, auth tests pass |
| 10 | Rewards promotions and corporate portal | Loyalty, promotions, corporate quotes | Ledger reconciliation, concurrent spend, cross-account tests pass |
| 11 | Advanced experiences and personalization | QR, subscriptions, recommendations (all flagged) | Each feature's flag tests pass; no incomplete integrations active |
| 12 | Release validation deployment and handover | Full audit, final test run, staging deploy, runbooks | Full acceptance criteria evidence; named owners; sign-offs |

---

## Test plan overview

### Unit tests (all prompts)
- Domain service business logic
- Pricing equations and rounding
- State machine transitions
- Modifier validation
- Ledger arithmetic

### Database integration tests (Prompts 5–10)
- Schema constraints (FK, unique, check)
- Concurrency: parallel reservation, points spend, gift redemption
- Idempotency key behavior
- Migration: clean install + upgrade path

### API contract tests (Prompts 6–10)
- Happy path for each endpoint
- Negative authorization (wrong owner, wrong branch, wrong role)
- State conflicts (409)
- Domain validation (422)
- Rate limiting (429)

### Provider contract tests (Prompts 7–8)
- Payment webhook: valid, invalid signature, duplicate, out-of-order
- POS adapter: success, timeout, duplicate dispatch, reconciliation mismatch

### Browser/e2e tests (Prompts 3–4, 12)
- Mobile and desktop layout
- English and Arabic language switching
- RTL directionality
- Keyboard navigation
- Screen reader smoke test
- Checkout journey (staging, with sandbox payment)

### Performance (Prompt 12)
- Lighthouse lab scores documented
- Core Web Vitals field monitoring configured for production

---

## Migration strategy

- All Prisma migrations reviewed before applying to any environment
- Never run `prisma migrate reset` against staging or production
- Each migration includes a `migration.sql` file reviewed for correctness
- For breaking changes: forward-compatible migration → code update → cleanup migration
- Rollback: document per-migration whether rollback is safe or requires forward repair
- Restore test: documented and rehearsed before production launch

---

## Open items blocking Prompt 2

The following decisions must be resolved before Prompt 2 starts:

| Decision | Status | Owner |
|---|---|---|
| Node.js version pin | OPEN | Engineering |
| Next.js version pin | OPEN | Engineering |
| NestJS version pin | OPEN | Engineering |
| Prisma version pin | OPEN | Engineering |
| PostgreSQL version pin | OPEN | Engineering |
| pnpm/Turborepo version pins | OPEN | Engineering |
| Identity provider shortlisted | OPEN (can proceed with stub) | Engineering |
| Hosting/dev environment baseline | OPEN (local Docker is acceptable) | Engineering |

**Note:** Version pins can be resolved by Engineering during Prompt 2 itself, with documentation in DECISIONS.md before scaffolding begins.
