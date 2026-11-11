# Integrations — Milestones Coffee 2.0

---

## Adapter design principle

Define provider-neutral interfaces for each integration domain. Keep provider-specific payloads inside adapters. Mocks must be explicitly labeled and cannot be selected by production configuration.

Each adapter must implement contract tests covering:
- Success path
- Invalid signatures
- Duplicate callbacks
- Throttling / rate limit responses
- Timeouts
- Partial failure

---

## Integration status summary

| Integration | Status | Phase | Owner |
|---|---|---|---|
| POS system | ⛔ VENDOR NOT SELECTED | 2 | Operations |
| Payment gateway | ⛔ PROVIDER NOT SELECTED | 2 | Finance |
| Identity / OTP / MFA | ⛔ PROVIDER NOT SELECTED | 2 | Engineering |
| Maps | ⚠️ Provider TBD | 1 (optional) | Engineering |
| Email / SMS / WhatsApp | ⛔ PROVIDER NOT SELECTED | 2 | Operations |
| Sanity CMS | 🟡 Known technology; schema TBD | 1 | Engineering |
| Analytics | ⚠️ GA4 proposed; consent not configured | 1 | Marketing/Engineering |
| Object storage (media) | ⛔ PROVIDER NOT SELECTED | 1 | Engineering |
| Shipping carrier | ⛔ NOT REQUIRED UNTIL RETAIL PHASE | 3 | Operations |
| Subscription billing | ⛔ NOT REQUIRED UNTIL PHASE 3 | 3 | Finance |

**All integrations with ⛔ status must remain disabled in code until vendor access is confirmed and pilot-tested.**

---

## 1. POS system

**Status:** Vendor identity and API access unverified.

**Required contract:**
- Catalog ownership: which fields does POS own vs. platform?
- SKU mapping strategy
- Stock semantics: does POS decrement on order placed, accepted, or fulfilled?
- Order acknowledgement flow and timing
- Cancellation handling
- Retry strategy for failed dispatch
- Reconciliation: how to detect and resolve mismatches

**Launch dependency:**
- End-to-end pilot with vendor sandbox required before Phase 2 ordering launch
- Staff fallback must be explicitly documented and approved (e.g., manual order management dashboard without POS)

**Adapter interface (placeholder):**
```typescript
interface PosAdapter {
  dispatchOrder(order: OrderDispatch): Promise<DispatchResult>;
  acknowledgeAcceptance(posRef: string): Promise<void>;
  syncCatalog(items: CatalogItem[]): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
}
```

---

## 2. Payment gateway

**Status:** Provider not selected. Finance must complete onboarding.

**Required contract:**
- UAE merchant eligibility and onboarding
- AED support
- Card brands and digital wallets supported
- Signed webhook format and replay rules
- Refund API (full and partial)
- Settlement export format
- Idempotency support
- PCI-DSS scope and tokenization approach

**Security requirements:**
- Provider-hosted or tokenized collection (never store PAN/CVV)
- Webhook signature verification on raw body + timestamp tolerance
- Sandbox and live pilot verification before launch

**Launch dependency:**
- Finance selects provider and completes onboarding
- Sandbox reconciliation tests must pass
- Live pilot branch test required

---

## 3. Identity and OTP / MFA

**Status:** Provider not selected.

**Required contract:**
- Issuer validation method
- Customer OTP: delivery channels (SMS / email / WhatsApp), rate limits, expiry
- Staff MFA: provider policy enforcement, recovery codes
- Session lifecycle: access token TTL, refresh strategy
- Account recovery flow
- Support ownership (who handles locked accounts)
- Token format (JWT claims required: issuer, subject, audience, expiry)

**Launch dependency:**
- Provider selected and credentials in secret manager
- Customer and staff auth tested end-to-end in staging
- Recovery flow documented

---

## 4. Maps

**Status:** Provider TBD (Google Maps likely candidate; requires budget approval).

**Required inputs:**
- Approved GPS coordinates for all branches (from FACTS_REGISTER.md)
- Browser API key with HTTP referrer restriction
- Server-side API key with IP restriction
- Quota and billing alert configuration

**Fallback:** Manual branch list (Phase 1 list-first approach works without maps).  
Phase 1 can launch without maps if provider is unavailable.

---

## 5. Email / SMS / WhatsApp notifications

**Status:** Provider not selected.

**Required contract:**
- Approved message templates per event (order confirmed, order ready, refund issued, etc.)
- Opt-in requirements: marketing vs. transactional
- Delivery receipts and retry limits
- Unsubscribe/opt-out handling
- Sending identity verification
- Per-channel consent tracking

**Events requiring notifications (at minimum):**
- Order placed (confirmation)
- Order ready for pickup
- Order cancelled / refund issued
- Gift card delivery
- OTP / verification codes (via identity provider)

**Launch dependency:** Provider approval and verified sending identities before Phase 2.

---

## 6. Sanity CMS

**Status:** Technology selected; schemas to be designed in Prompt 4.

**Integration points:**
- Localized schemas: pages (en + ar), articles, campaigns, FAQs, galleries, media
- Preview permissions: protect preview tokens; separate from public CDN
- Asset ownership: licensed media only; rights documented
- Publishing webhooks → Next.js cache revalidation
- Editorial workflow: draft → bilingual review → business verification → publish

**Launch dependency:**
- Approved content and media rights before any CMS record is published publicly
- Preview tokens must not be exposed in client-side code

---

## 7. Analytics

**Proposed:** Google Analytics 4 + Google Search Console

**Required before enabling:**
- Event taxonomy defined and reviewed (no personal data in payloads)
- Consent controls implemented (cookie banner; analytics disabled until consent)
- Purchase event deduplication (order ID as transaction ID)
- Exclude staff and test traffic from production data
- Search Console: domain property ownership verified

**Note:** Commercial targets require management approval; do not use analytics to invent sales projections.

---

## 8. Object storage (media)

**Status:** Provider not selected (S3-compatible).

**Requirements:**
- Signed upload URLs (never expose storage credentials to browser)
- Access policy: public read for approved product/branch media; private for uploads awaiting review
- Lifecycle rules: cleanup orphaned uploads
- CDN integration for delivery performance

---

## 9. Outbox, jobs and reconciliation

All provider interactions use the outbox/inbox pattern:

```
Outbox (database transaction) → BullMQ → Worker → Provider adapter
                                                        ↓
                                               idempotency_key recorded
                                                        ↓
                                               integration_attempt logged
                                                        ↓
                                           (on failure) retry with backoff
                                                        ↓
                                           (on exhaustion) failure queue → manual review
```

**Scheduled reconciliation:**
- Compare provider payments/settlements with local captures/refunds
- Compare POS acknowledgements with dispatch records
- Surface mismatches to Finance/Operations with trace IDs
- Provide safe retry controls (not automatic re-trigger of financial actions)

---

## Reconciliation and operations

- Maintain a provider status dashboard (integration health)
- Document manual resolution path for every integration failure type
- A queue retry is not proof a financial action failed — always reconcile before re-attempt
