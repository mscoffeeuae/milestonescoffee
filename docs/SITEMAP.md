# Sitemap — Milestones Coffee 2.0

All public routes use `/[locale]` prefix. Initial locales: `en` and `ar`.

---

## Discovery and commerce routes

| # | Page | Route (after locale) | Phase | Purpose |
|---|---|---|---|---|
| 01 | Home | `/` | 1 | Brand introduction; Order Now, Explore Menu, Find Branch |
| 02 | About | `/about` | 1 | Approved brand positioning |
| 03 | Our story | `/our-story` | 1 | Brand history |
| 04 | Coffee journey | `/coffee-journey` | 1 | Sourcing and preparation story |
| 05 | Menu | `/menu` | 1 | Category discovery |
| 06 | Menu category | `/menu/[category]` | 1 | Filter products |
| 07 | Menu product | `/menu/product/[slug]` | 1 | Variants, ingredients and allergens |
| 08 | Start order | `/order` | 2 | Choose branch and fulfillment time |
| 09 | Cart | `/order/cart` | 2 | Review items and modifiers |
| 10 | Checkout | `/order/checkout` | 2 | Identity, quote and payment |
| 11 | Confirmation | `/order/confirmation/[id]` | 2 | Secure order tracking |
| 12 | Locations | `/locations` | 1 | Searchable list and optional map |
| 13 | Branch detail | `/locations/[slug]` | 1 | Hours, services and directions |
| 14 | Shop | `/shop` | 2 | Retail product collection |
| 15 | Shop product | `/shop/[slug]` | 2 | Beans, grind and product options |
| 16 | Subscriptions | `/shop/subscriptions` | 3 | Plan selection and terms |
| 17 | Rewards overview | `/rewards` | 3 | Program explanation |
| 18 | Earn rewards | `/rewards/earn` | 3 | Approved earning rules |
| 19 | Redeem rewards | `/rewards/redeem` | 3 | Benefits and conditions |
| 20 | Gift cards | `/gift-cards` | 2 | Purchase and recipient details |
| 21 | Gift balance | `/gift-cards/balance` | 2 | Rate-limited balance lookup |
| 22 | Offers | `/offers` | 1 | Published marketing offers |
| 23 | Offer detail | `/offers/[slug]` | 1 | Terms and branch eligibility |

**Note:** Offer pages may launch as editorial content in Phase 1. Checkout discounts require backend promotion rules; a CMS page alone does not activate them.

---

## Services and accounts routes

| # | Page | Route (after locale) | Phase | Purpose |
|---|---|---|---|---|
| 24 | Corporate | `/corporate` | 1 | Service overview and enquiry |
| 25 | Catering | `/catering` | 1 | Event requirements form |
| 26 | Office coffee | `/office-coffee` | 1 | Recurring business service enquiry |
| 27 | Bulk orders | `/bulk-orders` | 1 | Volume request form |
| 28 | Journal | `/journal` | 1 | Editorial index |
| 29 | Article | `/journal/[slug]` | 1 | Localized editorial content |
| 30 | Gallery | `/gallery` | 1 | Approved media |
| 31 | Events | `/events` | 1 | Confirmed events |
| 32 | Careers | `/careers` | 1 | Vacancies and application routing |
| 33 | Contact | `/contact` | 1 | Approved contact channels |
| 34 | Feedback | `/feedback` | 1 | Branch feedback intake |
| 35 | FAQ | `/faq` | 1 | Approved service answers |
| 36 | Account | `/account` | 2 | Customer overview |
| 37 | Order history | `/account/orders` | 2 | Owned orders and receipts |
| 38 | Rewards account | `/account/rewards` | 3 | Ledger and redemptions |
| 39 | Profile | `/account/profile` | 2 | Identity and preferences |
| 40 | Addresses | `/account/addresses` | 2 | Saved addresses for later delivery |
| 41 | Privacy | `/privacy` | 1 | Approved privacy notice |
| 42 | Terms | `/terms` | 1 | Service terms |
| 43 | Refund policy | `/refund-policy` | 1 | Approved cancellation and refund rules |
| 44 | Allergens | `/allergens` | 1 | Approved information and cross-contact notice |

---

## Protected and utility routes

| Route | Type | Phase |
|---|---|---|
| `/[locale]/sign-in` | Customer auth | 2 |
| `/[locale]/sign-up` | Customer registration | 2 |
| `/[locale]/verify` | OTP verification | 2 |
| `/[locale]/recover` | Account recovery | 2 |
| `/[locale]/403` | Access denied | 1 |
| `/[locale]/404` | Not found | 1 |
| `/[locale]/503` | Service unavailable | 1 |
| `/admin/*` | Staff and HQ administration — **separate origin** | 2 |

**Admin app routes** (all protected, permission-scoped):
`/admin/dashboard`, `/admin/branches`, `/admin/catalog`, `/admin/orders`, `/admin/customers`, `/admin/loyalty`, `/admin/gift-cards`, `/admin/promotions`, `/admin/corporate`, `/admin/reports`, `/admin/integrations`, `/admin/audit`

---

## SEO and indexing rules

- Index approved public content only
- Exclude: cart, checkout, account, order confirmation, admin, personal URLs
- Authentication provides access protection — do not rely on `robots.txt` for private routes
- Create a reviewed redirect map for all legacy URLs before Phase 1 launch
- Add localized metadata, canonical URLs, `hreflang` and accurate structured data
- Unavailable features must not appear as active navigation items

---

## Route notes

- Dynamic routes (`[category]`, `[slug]`, `[id]`) generate additional pages for approved records only
- `/order/confirmation/[id]` is scoped by high-entropy token, not sequential ID
- Phase 1 corporate enquiry pages route through validated, rate-limited server endpoints
- Phase 3 subscription and QR routes require explicit operational readiness sign-off
