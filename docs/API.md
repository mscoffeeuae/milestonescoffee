# API — Milestones Coffee 2.0

**Base path:** `/api/v1`  
**Format:** REST + OpenAPI (typed clients generated for web and admin)  
**All protected routes enforce:** identity, role, resource ownership and branch scope.

---

## HTTP status code conventions

| Code | Meaning |
|---|---|
| 400 | Malformed input |
| 401 | Missing or invalid authentication |
| 403 | Forbidden (authenticated but not authorized) |
| 404 | Inaccessible or absent resource |
| 409 | State conflict or idempotency conflict |
| 422 | Domain validation failure |
| 429 | Rate limit exceeded |

Return stable error codes and localized presentation keys. Never reveal private records or provider secrets in error responses.

---

## Error envelope

```json
{
  "error": {
    "code": "QUOTE_EXPIRED",
    "messageKey": "checkout.requote",
    "requestId": "trace-id",
    "details": { "cartId": "uuid" }
  }
}
```

---

## Public endpoints

### Branches and catalog

| Method | Path | Access |
|---|---|---|
| GET | `/branches` | Public approved records |
| GET | `/branches/:id` | Public approved records |
| GET | `/branches/:id/hours` | Public approved records |
| GET | `/categories` | Public approved records |
| GET | `/products/:id` | Public approved records |
| GET | `/branches/:id/menu` | Public approved records; branch-specific prices |

---

## Customer endpoints (authenticated)

### Cart

| Method | Path | Notes |
|---|---|---|
| POST | `/carts` | Create cart (customer or guest token) |
| POST | `/carts/:id/items` | Add item; validate modifiers |
| PATCH | `/carts/:id/items/:itemId` | Update quantity |
| DELETE | `/carts/:id/items/:itemId` | Remove item |

### Checkout

| Method | Path | Notes |
|---|---|---|
| POST | `/checkout/quotes` | Server computes totals; returns immutable quote |
| POST | `/checkout/orders` | Idempotent (Idempotency-Key header required) |

**Quote contract:**
```json
POST /api/v1/checkout/quotes
{ "cartId": "uuid", "cartVersion": 4, "pickupAt": "ISO-8601" }

200
{
  "quoteId": "uuid",
  "expiresAt": "ISO-8601",
  "currency": "AED",
  "subtotalFils": 2000,
  "discountFils": 0,
  "taxFils": 100,
  "totalFils": 2100,
  "pricingPolicyVersion": "v1",
  "lines": [...]
}
```
Amounts are illustrative contract fixtures. Server resolves prices, modifiers, promotions and tax from approved sources. Browser never supplies authoritative totals.

**Idempotent order creation:**
```json
POST /api/v1/checkout/orders
Idempotency-Key: <client-generated unique key>
{ "quoteId": "uuid", "contact": { "phoneE164": "+971..." } }

201
{
  "orderId": "uuid",
  "status": "PENDING_PAYMENT",
  "paymentStatus": "PENDING",
  "paymentAction": { "type": "redirect" }
}
```
- Scope keys by principal and operation
- Store requestHash + resultRef
- Identical retry → same result
- Changed body → 409 conflict
- Revalidate expiry, cart version, stock, branch hours, pickup capacity before reserving

### Payments

| Method | Path | Notes |
|---|---|---|
| POST | `/payments/intents` | Create provider payment intent |
| POST | `/webhooks/payments/:provider` | Verify signature on raw body; durable inbox |

### Orders

| Method | Path | Notes |
|---|---|---|
| GET | `/orders/:id` | Owner or limited tracking token (high-entropy, not sequential ID) |
| GET | `/me/orders` | Customer's own orders |
| POST | `/orders/:id/cancel` | Customer-initiated cancellation (state machine guarded) |

### Profile

| Method | Path | Notes |
|---|---|---|
| GET/PATCH | `/me` | Authenticated customer |
| GET/POST | `/me/addresses` | Customer's saved addresses |
| PATCH/DELETE | `/me/addresses/:id` | Ownership enforced |

### Loyalty

| Method | Path | Notes |
|---|---|---|
| GET | `/me/loyalty` | Customer's loyalty account and balance |
| GET | `/rewards` | Available rewards |
| POST | `/rewards/redemptions` | Atomic point spend |

### Gift cards

| Method | Path | Notes |
|---|---|---|
| POST | `/gift-cards/purchases` | Requires payment confirmation |
| POST | `/gift-cards/balance` | Rate-limited; masked code |
| POST | `/gift-cards/redemptions` | Atomic; partial use supported |

### Promotions

| Method | Path | Notes |
|---|---|---|
| POST | `/promotions/validate` | Server validation only; never client-computed |

### Corporate

| Method | Path | Notes |
|---|---|---|
| POST | `/corporate/enquiries` | Public intake; rate-limited |
| GET | `/me/corporate/quotes` | Account membership required |
| POST | `/corporate/quotes/:id/accept` | Account membership; records acceptance |

---

## Administration endpoints (staff, permission-scoped)

| Resource | Path prefix | Scope |
|---|---|---|
| Branches | `/admin/branches` | Permission + branch-scoped for branch staff |
| Catalog | `/admin/catalog` | HQ or permitted catalog managers |
| Orders | `/admin/orders` | Branch-scoped |
| Customers | `/admin/customers` | Restricted read; no bulk export without permission |
| Loyalty | `/admin/loyalty` | Authorized adjustment with reason capture |
| Gift cards | `/admin/gift-cards` | Finance permission; masked codes |
| Promotions | `/admin/promotions` | HQ |
| Corporate | `/admin/corporate` | Assigned account manager |
| Reports | `/admin/reports` | Finance and HQ |
| Refunds | `/admin/refunds` | Finance; bounded refund limits |
| Integrations | `/admin/integrations` | Health status; no credential exposure |
| Audit | `/admin/audit` | Super Admin; redacted sensitive fields |

---

## Integration webhooks

| Method | Path | Notes |
|---|---|---|
| POST | `/webhooks/pos/:provider` | Verified provider signature; durable inbox |
| GET | `/admin/integrations/health` | Authorized staff; provider status |

---

## Order state machine

```
PENDING_PAYMENT → CONFIRMED → ACCEPTED → PREPARING → READY → COMPLETED
                                                              ↘ CANCELLED (controlled, with reason)
                                                   ↘ FAILED (controlled terminal)
```

- Guard each transition server-side
- Append `order_events` for every transition
- A cancelled order cannot become READY through ordinary retry
- Payment received for expired/cancelled order → exception handling only

**Payment states:** PENDING → AUTHORIZED → CAPTURED → FAILED / PARTIALLY_REFUNDED / REFUNDED (/ VOIDED if provider supports it)

Refund requests: PENDING → SUCCEEDED / FAILED. Not settled until provider verification.

---

## Pagination, filtering and sorting

- All list endpoints: explicit page size bounds
- Filters and sort options: explicitly declared in OpenAPI schema
- Cursor-based pagination preferred for large time-ordered sets (order history, audit logs)

---

## OpenAPI and client generation

- Publish full OpenAPI 3.x schema at `/api/v1/openapi.json`
- Generate typed clients in `packages/contracts` from the schema
- Both `apps/web` and `apps/admin` import from `contracts` only — never call the DB directly
- Regenerate clients as part of CI on API schema changes

---

## Authorization model summary

| Check | Where enforced |
|---|---|
| Token validity, issuer, audience, expiry | API middleware |
| Customer identity → own resources | Resource-level ownership check |
| Staff role → permitted actions | Role/permission table |
| Staff branch scope | `staff_branch_assignments` join |
| Guest cart token | Scoped high-entropy token |
| Order tracking token | High-entropy, not sequential order number |
