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

## Technology version decisions (OPEN — resolve before Prompt 2)

### D-V-001 — Node.js version
**Status:** OPEN  
**Action:** Check LTS releases; prefer current LTS  
**Source:** https://nodejs.org/en/about/previous-releases

### D-V-002 — Next.js version
**Status:** OPEN  
**Note:** Project report mentioned 16.x as a planning baseline — treat as a planning estimate, not a verified version. Next.js versioning is currently at 14.x/15.x; verify current stable release.  
**Action:** Verify current stable release; pin tested version  
**Source:** https://nextjs.org/docs

### D-V-003 — NestJS version
**Status:** OPEN  
**Action:** Verify current stable version compatible with chosen Node.js version  
**Source:** https://docs.nestjs.com

### D-V-004 — Prisma version
**Status:** OPEN  
**Action:** Verify current stable version; check PostgreSQL driver compatibility  
**Source:** https://www.prisma.io/docs

### D-V-005 — PostgreSQL version
**Status:** OPEN  
**Action:** Verify version supported by chosen hosting provider  
**Source:** Hosting provider documentation

### D-V-006 — Sanity version
**Status:** OPEN  
**Action:** Verify current Sanity Studio and SDK versions  
**Source:** https://www.sanity.io/docs

### D-V-007 — React version
**Status:** OPEN  
**Action:** Align with chosen Next.js version requirements

### D-V-008 — TypeScript version
**Status:** OPEN  
**Action:** Verify compatibility with chosen Next.js and NestJS versions

### D-V-009 — Redis version
**Status:** OPEN  
**Action:** Verify version supported by chosen hosting; BullMQ compatibility

### D-V-010 — pnpm and Turborepo versions
**Status:** OPEN  
**Action:** Use current stable versions; verify workspace protocol support

---

## Decision log

| Date | ID | Change |
|---|---|---|
| 2026-11-11 | D-001 | Recorded from project report |
| 2026-11-11 | D-002 | Recorded from project report |
| 2026-11-11 | D-003 to D-V-010 | Opened during Prompt 1 discovery |
