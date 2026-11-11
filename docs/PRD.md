# Product Requirements Document — Milestones Coffee 2.0

**Version:** 1.0 — Discovery  
**Date:** 2026-11-11  
**Source:** Milestones Coffee 2.0 Project Report (Option C), v1.0

---

## 1. Purpose

Build a bilingual (English + Arabic) digital platform connecting customers, branches and head office through one governed catalog, reliable ordering, customer rewards and corporate services.

---

## 2. Delivery decision

Option C — Complete digital coffee platform.  
Modular monolith: Next.js customer website + admin app, NestJS business API, PostgreSQL + Prisma, Sanity CMS, Redis + BullMQ.

Deliver the public website first, then introduce commerce and customer programs through controlled branch pilots.

---

## 3. Product goals

| Goal | Required outcome | Measure |
|---|---|---|
| Brand and discovery | Premium English + Arabic pages, accurate locations and menu | Approved branch coverage and content completeness |
| Customer conversion | Branch selection, customization and clear pickup checkout | Menu-to-cart and checkout completion funnels |
| Operational reliability | Orders reach staff once; payment and fulfillment reconcile | Dispatch failures, duplicate effects and unpaid fulfillment |
| Retention | Transparent rewards and gift balances with histories | Repeat order rate and reconciled program ledgers |
| Corporate growth | Qualified enquiries and traceable quotations | Enquiry response time and quote conversion |
| Maintainability | Typed contracts, clear ownership, automated release checks | Tested releases, recovery drills, defect trends |

**Success measurement:** Establish current traffic and conversion baselines during discovery. Commercial targets require management approval — do not invent expected revenue uplift.

---

## 4. Scope

### Included
Brand website, menu, locations, pickup ordering, retail shop, accounts, loyalty, digital gift cards, corporate portal, staff tools and integrations.

### Staged
Subscriptions, QR ordering, personalization and grounded recommendations follow operational readiness.

### Future-ready (not in scope)
Versioned APIs and shared contracts support future native mobile apps. Native app delivery is not part of initial releases.

---

## 5. Stakeholders

| Role | Responsibility |
|---|---|
| Business sponsor | Approves scope and rollout |
| Operations | Branch readiness, pickup rules |
| Finance | Tax, payment, refund configuration |
| Marketing | Approved bilingual content |
| Engineering | Delivery and runbooks |
| Privacy/legal reviewer | Customer terms and retention rules |

---

## 6. Delivery phases summary

| Phase | Scope | Indicative duration |
|---|---|---|
| Discovery | Facts, vendors, design, compatibility, acceptance plan | Depends on access |
| Phase 1 | Premium bilingual website, CMS, menu, branches, corporate enquiries, SEO, analytics | 4–6 weeks |
| Phase 2 | Accounts, cart, pickup ordering, payments, POS, staff tools, retail shop, gift cards, PWA | 6–10 additional weeks |
| Phase 3 | Rewards, segmentation, corporate portal, QR ordering, subscriptions, recommendations, advanced analytics | 4–8 additional weeks |
| Rollout | Gradual branch expansion, reliability from measured usage | — |

**Indicative range:** 14–24 weeks (excluding discovery and procurement delays).  
**Not a delivery commitment.** Staffing, POS capabilities, payment onboarding, content production and bilingual review determine actual schedule.

---

## 7. UI and customer experience requirements

### Visual direction
Warm: espresso brown, ivory and restrained bronze, with generous spacing and approved coffee photography. **Final colors, fonts and logo usage require brand approval.**

### Key surfaces

| Surface | Required experience | Failure states |
|---|---|---|
| Home | Hero with Order Now, Explore Our Menu and Find a Branch; featured products, locations, story, rewards and corporate | Static fallback, reduced motion, keyboard focus |
| Menu and product | Category filters, branch-aware prices, variants, modifier groups, allergen info | Unavailable option, missing branch, no results, invalid selections |
| Branch locator | List first, map enhancement, area search, service filters, local hours and directions | Manual search when location denied; accessible list without map |
| Checkout | Persistent branch and pickup time, server quote, clear fees, payment status | Expired quote, closed branch, sold-out item, failed payment, safe retry |
| Account and rewards | Recent orders, explicit point history, reward eligibility, consent settings | Expired session, empty state, pending refund |
| Branch dashboard | Order queue, elapsed time, controlled status actions, exception alerts | Disconnected state, delayed POS, audited recovery |

### Language and direction
- Explicit locale routing: `/en/...` and `/ar/...`
- Translated metadata and formatted AED amounts and local dates
- Set page `lang` and `dir` correctly; use logical spacing properties
- Mirror directional controls where appropriate
- Preserve route context when changing languages
- Review Arabic with a native-language reviewer (checkout and transactional messages)

### Interaction standards
- Mobile-first; adequate touch targets, labels and keyboard operation
- Target WCAG 2.2 AA; test with screen readers
- State must not be communicated by color alone
- Announce validation and order updates appropriately
- Skeleton, empty, error and retry states for every data-driven view
- Never cache private account data or checkout responses in a public PWA cache

### Performance targets (proposed, not guaranteed)
- LCP ≤ 2.5 s at p75 of real visits
- INP ≤ 200 ms at p75 of real visits
- CLS ≤ 0.1 at p75 of real visits
- Use lab tests before launch and field monitoring afterward

---

## 8. Acceptance criteria summary

| Area | Pass condition |
|---|---|
| Content and localization | All released pages have approved English and Arabic content and valid localized navigation |
| Catalog and prices | Branch availability and server totals match approved catalog fixtures and rounding rules |
| Ownership and roles | Customers cannot access others' records; staff cannot cross assigned branches |
| Payment reliability | Duplicate or reordered events create one financial effect; redirect alone never confirms payment |
| Concurrency | Last stock item, pickup capacity, coupon use, points and gift balance cannot be overspent |
| Order recovery | Paid but unfulfillable orders enter a visible exception and refund path |
| Ledgers | Balances equal immutable transactions; refund reversals occur once |
| Accessibility | WCAG 2.2 AA with no unresolved blocking issue |
| Performance | LCP, INP, CLS targets with p75 field data |
| Security and recovery | Secrets out of code/logs; restore and controlled release procedures work |
| SEO and analytics | Legacy redirects work; public pages indexable; private excluded; purchases deduplicate |
| Integration honesty | Each enabled provider works in its configured environment; mocks clearly marked |

### Definition of done
Every increment includes code, relevant tests, migration review, updated documentation, observability and a concise handoff listing completed scope and unresolved blockers. Passing unit tests alone is insufficient for payment, permissions or concurrent balance changes.

---

## 9. Missing business inputs required before phases can proceed

See `docs/DECISIONS.md` for owners and resolution points.

**Before any public launch:**
- Approved legal brand wording
- Active branch register (addresses, phones, coordinates, services, hours verified)
- Authoritative SKUs, variants, modifiers, allergens and branch prices
- Approved bilingual copy
- Privacy/legal review complete
- Redirect map reviewed

**Before Phase 2 checkout pilot:**
- Payment gateway selected and sandbox access granted (Finance)
- Tax policy approved (inclusive/exclusive, rate, rounding) (Finance)
- Identity provider selected (Engineering)
- POS vendor API access granted (Operations)
- Guest ordering policy approved (Operations + Security)

**Before Phase 3:**
- Loyalty earn rates, expiry rules and tier thresholds (Finance + Marketing)
- Gift card stored-value policy and refund behavior (Finance)
- Corporate credit billing and recurring contract policy (Commercial)
- Subscription provider and recurring consent flow (Operations)

---

*Document maintained by Engineering. Business facts become production behavior only after the responsible owner confirms them.*
