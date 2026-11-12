# Decisions Register — Milestones Coffee 2.0

**Purpose:** Record architecture decisions, version pins, working assumptions and unresolved business inputs.

**Format:** Each entry has an ID, status, decision, rationale, alternatives considered, owner and resolution date.

**Status values:**
- `DECIDED` — approved and locked
- `WORKING ASSUMPTION` — proceeding with this; needs confirmation
- `OPEN` — blocking; needs resolution before dependent feature can proceed
- `SUPERSEDED` — replaced by a newer decision (reference the new ID)

---

## Architecture decisions

### D-001 — Delivery architecture
**Status:** DECIDED (from project report)  
**Decision:** Modular monolith with Next.js web + admin, NestJS API, PostgreSQL + Prisma, Sanity CMS, Redis + BullMQ.  
**Rationale:** Shared code, single deployment unit initially, boundary between presentational and transactional layers. Separate services only when measured scale or operational boundaries justify.  
**Owner:** Engineering

---

### D-002 — Monorepo tooling
**Status:** DECIDED (from project report)  
**Decision:** pnpm + Turborepo for monorepo management.  
**Rationale:** Shared lockfile, task orchestration, dependency boundary enforcement.  
**Owner:** Engineering

---

### D-003 — Catalog authority: POS or platform?
**Status:** OPEN 🚨  
**Question:** For each catalog field (product names, prices, stock counts, availability), does the POS system own the data or does the platform?  
**Why it matters:** Dual editing without a defined authority causes data drift and ordering errors.  
**Owner:** Operations and Engineering  
**Resolution point:** Before POS integration work begins (Prompt 8)  
**Blocks:** POS adapter design, catalog sync, branch_products write direction

---

### D-004 — Identity provider
**Status:** OPEN 🚨  
**Question:** Which managed provider for customer OTP auth and staff MFA?  
**Options to evaluate:** Supabase Auth, Auth0, Clerk, Firebase Auth, AWS Cognito  
**Requirements:** Customer phone/email OTP, staff MFA, JWT with issuer/audience/expiry, session lifecycle, rate limiting, UAE data residency preference  
**Owner:** Engineering  
**Resolution point:** Before Prompt 5 (database identity schema)  
**Blocks:** All authentication, accounts, staff access

---

### D-005 — Payment gateway
**Status:** OPEN 🚨  
**Question:** Which payment gateway for UAE AED payments?  
**Options to evaluate:** Stripe (UAE), Checkout.com, PayTabs, Telr, Network International, Tap Payments  
**Requirements:** UAE merchant eligibility, AED, card brands and digital wallets, signed webhooks, refunds, settlement exports, PCI-DSS tokenization  
**Owner:** Finance  
**Resolution point:** Before Prompt 7 (payments)  
**Blocks:** Checkout pilot, all payment flows

---

### D-006 — POS vendor
**Status:** OPEN 🚨  
**Question:** Which POS system is currently used at Milestones branches?  
**Owner:** Operations  
**Resolution point:** Before Prompt 8 (branch operations/POS)  
**Blocks:** POS integration, order dispatch, catalog sync

---

### D-007 — Tax policy
**Status:** OPEN 🚨  
**Question:** Are displayed prices inclusive or exclusive of tax? What is the applicable tax rate? What is the rounding method and discount allocation rule?  
**Why it matters:** One equation must be defined and tested; defines `checkout_quotes.taxFils` calculation  
**Owner:** Finance  
**Resolution point:** Before Phase 2 checkout pilot  
**Blocks:** Checkout quote contract, `order_items` tax snapshots, receipt generation

---

### D-008 — Guest ordering
**Status:** OPEN  
**Question:** Is guest checkout (without account creation) permitted?  
**Requirements if yes:** Scoped high-entropy guest tokens, verified contact policy, rate limiting, abuse controls  
**Owner:** Operations and Security  
**Resolution point:** Before Phase 2 checkout  
**Blocks:** `carts.guestTokenHash` behavior, guest order tracking

---

### D-009 — Loyalty program rules
**Status:** OPEN  
**Question:** Earn rate per AED spent, point expiry, tier thresholds, eligible order types, birthday benefits?  
**Owner:** Finance and Marketing  
**Resolution point:** Before Phase 3 loyalty activation  
**Blocks:** `loyalty_rules` table, earn/redemption logic, Phase 3

---

### D-010 — Gift card policies
**Status:** OPEN  
**Question:** Initial denominations, expiry, partial use refund behavior, maximum balance, stored-value regulatory requirements?  
**Owner:** Finance  
**Resolution point:** Before Phase 2 gift cards  
**Blocks:** `gift_cards` schema, issuance and redemption logic

---

### D-011 — Hosting provider and region
**Status:** OPEN  
**Question:** Which cloud provider? Which region (UAE preference)? Data residency requirements?  
**Owner:** Engineering + Privacy reviewer  
**Resolution point:** Before production deployment  
**Blocks:** Deployment configuration, backup strategy, RPO/RTO achievability

---

### D-012 — Privacy and retention
**Status:** OPEN  
**Question:** Applicable UAE privacy regulations, vendor data locations, international transfers, retention periods for different data types (orders, personal data, financial records)?  
**Owner:** Designated privacy/legal reviewer  
**Resolution point:** Before customer-facing launch  
**Blocks:** `customer_deletion_requests` workflow, `audit_logs` retention, consent implementation

---

### D-013 — Maps provider
**Status:** OPEN  
**Question:** Google Maps or alternative? Budget approval required?  
**Owner:** Engineering  
**Resolution point:** Before Phase 1 launch (or proceed with list-only view)  
**Blocks:** Branch locator map view (not list view)

---

### D-014 — Fulfillment scope
**Status:** WORKING ASSUMPTION  
**Assumption:** Pickup first; delivery, table service and shipping added only when operationally ready.  
**Owner:** Operations  
**Resolution point:** Before Phase 2 activation  
**Blocks:** Shipping/delivery adapter design

---

## Technology version decisions (DECIDED — resolved in Prompt 2)

### D-V-001 — Node.js version
**Status:** DECIDED  
**Decision:** Node.js 22.x LTS (22.23.4 confirmed available)  
**Source:** Verified in environment — `node --version`

### D-V-002 — Next.js version
**Status:** DECIDED  
**Decision:** Next.js 16.4.6 (npm `latest` tag as of 2026-11-11)  
**Note:** Project report's "16.x" estimate was correct — 16.x is the current stable series.  
**Source:** npm registry dist-tags verified

### D-V-003 — NestJS version
**Status:** DECIDED  
**Decision:** NestJS 12.4.2 (npm `latest` tag as of 2026-11-11)  
**Source:** npm registry dist-tags verified

### D-V-004 — Prisma version
**Status:** DECIDED  
**Decision:** Prisma 7.10.1 (`prev` tag — stable; 8.x is still in RC as of 2026-11-11)  
**Rationale:** 8.0.0-rc.33 is the `latest` npm tag but labeled RC in version string; using last stable 7.x.  
**Source:** npm registry dist-tags verified

### D-V-005 — PostgreSQL version
**Status:** DECIDED  
**Decision:** PostgreSQL 17 (docker image `postgres:17-alpine`)  
**Note:** Subject to hosting provider support — confirm before production deployment.  
**Source:** docker-compose.yml

### D-V-006 — Sanity version
**Status:** DECIDED  
**Decision:** sanity@6.23.0, @sanity/client@8.15.1 (npm `latest` tags as of 2026-11-11)  
**Source:** npm registry dist-tags verified

### D-V-007 — React version
**Status:** DECIDED  
**Decision:** React 19.3.1 (required by Next.js 16.x)  
**Source:** npm registry dist-tags verified

### D-V-008 — TypeScript version
**Status:** DECIDED  
**Decision:** TypeScript 7.0.2 for `web`, `admin`, `studio`; `^6.0.0` for `api` and `worker`  
**Reason:** NestJS 12 uses TypeScript's programmatic compiler API which TS 7.0 removed (restored in 7.1). Downgraded api/worker to ^6 until NestJS 12 drops the dependency or TS 7.1 ships.  
**Source:** npm registry + NestJS 12 runtime error 2026-11-12

### D-V-009 — Redis version
**Status:** DECIDED  
**Decision:** Redis 7 (docker image `redis:7-alpine`), ioredis@6.0.0, BullMQ@6.7.4  
**Source:** docker-compose.yml + npm registry

### D-V-010 — pnpm and Turborepo versions
**Status:** DECIDED  
**Decision:** pnpm@10.28.0 (installed), Turborepo@2.11.10 (npm `latest` tag)  
**Source:** Environment verified + npm registry

---

## Decision log

| Date | ID | Change |
|---|---|---|
| 2026-11-11 | D-001 | Recorded from project report |
| 2026-11-11 | D-002 | Recorded from project report |
| 2026-11-11 | D-003 to D-V-010 | Opened during Prompt 1 discovery |
| 2026-11-11 | D-V-001 to D-V-010 | Resolved during Prompt 2 — all version pins decided |
