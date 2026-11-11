# Database — Milestones Coffee 2.0

**Technology:** PostgreSQL + Prisma  
**Convention:** UUID primary keys, `timestamptz` audit timestamps, FK indexes, explicit constraints.

---

## Monetary values
- Store AED as **integer fils** (1 AED = 100 fils). Never use floating-point for money.
- Column suffix convention: `...Fils` (e.g., `priceFils`, `totalFils`, `discountFils`)

## Timestamps
- Store instants as `timestamptz` in UTC.
- Use `Asia/Dubai` for branch display, scheduling and local date logic.
- Never store a local time as a UTC instant without documenting the offset assumption.

## Primary keys
- UUIDs on all entities. Use `@default(uuid())` in Prisma.

## Soft deletes
- Archive products/variants instead of deleting (set `status = ARCHIVED`).
- Financial rows (orders, payments, refunds, ledger entries) are never deleted; anonymize eligible personal fields through an approved retention workflow.

---

## 1. Catalog schema

### `branches`
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| code | String UNIQUE | Short operational code |
| slug | String UNIQUE | URL-safe; unique |
| nameEn | String | |
| nameAr | String | |
| address | Json | Structured address |
| coordinates | Json | lat/lng |
| timezone | String | `Asia/Dubai` |
| status | Enum | DRAFT / ACTIVE / INACTIVE |
| createdAt/updatedAt | timestamptz | |

### `branch_hours`
Weekly schedule. Multiple intervals supported (split shifts).

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| branchId | UUID FK → branches | |
| weekday | Int | 0 = Sunday … 6 = Saturday |
| opensAt | String | HH:MM local time |
| closesAt | String | HH:MM local time |
| overnight | Boolean | True if closes next day |

### `branch_closures`
Overrides weekly hours. Unique per branch+localDate.

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| branchId | UUID FK → branches | |
| localDate | Date | YYYY-MM-DD in Asia/Dubai |
| closed | Boolean | Full closure |
| overrideIntervals | Json | Replacement open intervals |

### `categories`
Self-referential for subcategories.

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| parentId | UUID FK → categories nullable | Prevent parent cycles via constraint |
| nameEn/nameAr | String | |
| slug | String UNIQUE | |
| sortOrder | Int | |

### `products`
Archive instead of delete.

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| categoryId | UUID FK → categories | |
| sku | String UNIQUE | |
| slug | String UNIQUE | |
| nameEn/nameAr | String | |
| taxCategory | String | |
| status | Enum | ACTIVE / ARCHIVED |

### `product_variants`

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| productId | UUID FK → products | Index |
| sku | String UNIQUE | |
| labelEn/labelAr | String | |
| basePriceFils | Int | ≥ 0 CHECK constraint |

### `modifier_groups`

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| nameEn/nameAr | String | |
| minSelections | Int | 0 ≤ min ≤ max |
| maxSelections | Int | |

### `modifier_options`

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| groupId | UUID FK → modifier_groups | Index |
| labelEn/labelAr | String | |
| priceDeltaFils | Int | Bounded valid adjustments |
| status | Enum | ACTIVE / INACTIVE |

### `product_modifier_groups`
Junction. Unique product+group.

### `branch_products`
Branch-variant availability and pricing. Unique branchId+variantId.

| Field | Type | Notes |
|---|---|---|
| priceFils | Int | ≥ 0, branch override |
| available | Boolean | |
| dailyLimit | Int nullable | |

### `inventory_items`
Atomic reservation checks. Unique stock key.

| Field | Type | Notes |
|---|---|---|
| version | Int | Optimistic concurrency |
| onHand | Int | |
| reserved | Int | |

### `product_media`
Safe media references; localized alt text. Sorted display.

### `product_allergens`
Unique product+allergenCode. Requires `evidenceRef` before publication.

### `branch_services`
Unique branchId+serviceCode.

### `integration_mappings`
Unique provider+entityType+externalId.

---

## 2. Customer and commerce schema

### `customers`
| Field | Type | Notes |
|---|---|---|
| authIssuer | String | External auth provider |
| authSubject | String | Unique issuer+subject |
| name/email/phoneE164/locale | String | Normalized, verified |

### `customer_addresses`
At most one default per customer.

### `customer_consents`
Append consent evidence and withdrawal history. Never overwrite.

### `customer_deletion_requests`
Restrict access; apply retention exceptions.

### `carts`
One owner mode (customer FK or guestTokenHash). Indexed on expiry and owner.

### `cart_items`
quantity > 0.

### `cart_item_modifiers`
Validate group limits and product eligibility at write time.

### `checkout_quotes`
Immutable quoted result. Reject stale quote (check `cartVersion` + `expiresAt`).

| Field | Notes |
|---|---|
| subtotalFils / discountFils / taxFils / totalFils | Integer fils only |
| pricingPolicyVersion | Required for audit |
| expiresAt | Server-set; client must revalidate |

### `orders`
Unique orderNumber. Branch+date and customer+date indexes.

**Invariant:** `order.totalFils` = sum of line totals + approved fees ± tax (one equation, documented in pricing contract, tested).

### `order_items`
Quantity > 0. **Immutable after confirmation.** Snapshot: variantId, SKU, names, quantities, unit price, line discount, line tax, line total, currency, tax policy version, promotion references, quote version.

### `order_item_modifiers`
Preserve historic configuration and amounts.

### `order_events`
Append only. Index orderId+occurredAt. Valid state machine transitions only.

### `payments`
Unique provider+externalId.

### `refunds`
Unique provider reference. Bounded cumulative refunds.

### `inventory_reservations`
Unique reservation source. Atomic release/consume.

### `pickup_reservations`
Atomic capacity allocation. Unique order reservation.

---

## 3. Loyalty and corporate schema

### `loyalty_accounts`
Unique per customer. `balanceProjection` accelerates reads; ledger is authoritative.

**Invariant:** `balanceProjection` must reconcile to `loyalty_transactions` sum.

### `loyalty_transactions`
Append only. Unique business source+action (idempotency).

### `loyalty_rules`
Published versions immutable once used in a transaction.

### `rewards`
Positive pointsCost. Approved benefit rules.

### `redemptions`
Atomic reserve → commit → reverse operations.

### `gift_cards`
Store keyed code digest only. Never expose full code in logs or staff views. Unique.

**Invariant:** `balanceProjection` reconciles to `gift_card_transactions` sum.

### `gift_card_transactions`
Append only. Unique source+action.

### `promotions`
Normalized unique code when present.

### `promotion_redemptions`
Unique order+promotion. Atomic usage limits.

### `corporate_accounts`
Controlled access.

### `corporate_enquiries`
Spam controls and consent evidence.

### `corporate_quotes`
Unique number+version. Approval audit. Immutable on acceptance.

### `subscriptions`
Explicit recurring consent. Unique provider reference.

### `subscription_cycles`
Unique subscription+billing cycle.

---

## 4. Administration and integration schema

### `staff_users`
Unique authIssuer+authSubject. Separate from customer roles.

### `audit_logs`
Append only. Restricted read. Retention policy. Redacted diffs.

### `outbox_events`
Written atomically with business transaction. Retry metadata. Status: PENDING / DISPATCHED / FAILED.

### `webhook_inbox`
Unique provider+eventId. Verified provenance before processing.

### `idempotency_keys`
Unique scope+key. Reject changed-request reuse. Store requestHash + resultRef.

### `notification_deliveries`
Unique event+channel+recipient+template.

### `api_integration_credentials`
Reference only (points to secret manager). No plaintext secrets.

### `scheduled_jobs`
Unique logical schedule key.

### `integration_attempts`
Index pending/retry. Redact request and response payloads.

### `reconciliation_runs`
Track run identity and reviewed discrepancies.

---

## Concurrency rules

- Never: unprotected read-then-write for balances
- Use: database transactions + row locks OR optimistic version checks with bounded retries
- Avoid: provider calls inside long database transactions
- Pattern: persist intent → external call → record outcome (idempotency key)
- Reconcile uncertain outcomes before retrying a financial action

---

## Schema completeness gate (before Prompt 2 migration)

- [ ] All inverse Prisma relations defined
- [ ] All enums declared
- [ ] Foreign-key indexes added
- [ ] `timestamptz` on all audit fields
- [ ] UUID defaults on all primary keys
- [ ] Check constraints for positive quantities, nonneg prices, valid ranges
- [ ] Prisma client generated successfully
- [ ] Clean-database migration runs without error
- [ ] Upgrade migration from representative prior schema tested
- [ ] Deterministic development seeds added
- [ ] Restore test documented
- [ ] Migration rollback or forward-repair instructions documented
