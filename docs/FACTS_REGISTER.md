# Facts Register — Milestones Coffee 2.0

**Purpose:** Every production claim about the business must appear here with a source, capture date, owner and verification result before it can be used in seed data, content or configuration.

**Rule:** Production seed data must never use invented addresses, prices, reviews, branch services or allergens. If a fact is not in this register as VERIFIED, it is a candidate only.

---

## Register format

Each entry:

| Field | Description |
|---|---|
| Claim | The specific fact or data point |
| Source | URL, file, meeting reference or verbal report with date |
| Capture date | YYYY-MM-DD |
| Owner | Person responsible for verification |
| Status | CANDIDATE / VERIFIED / REJECTED / SUPERSEDED |
| Verification result | What was checked, when and by whom |
| Publication approved | Yes / No / Pending |

---

## Brand facts

| Claim | Source | Capture date | Owner | Status | Notes |
|---|---|---|---|---|---|
| Emirati brand | Prior public website review (planning conversation) | 2026-11-11 | Operations | CANDIDATE | Requires management approval of legal brand wording before publication |
| ~30 branches in Abu Dhabi and Al Ain | Prior public website review (planning conversation) | 2026-11-11 | Operations | CANDIDATE | Active branch register with addresses, phones, coords, services and hours not yet supplied |
| Public website: https://milestonescoffee.ae/ | Evidence register in project report | 2026-11-11 | Engineering | CANDIDATE | Site exists; full audit not completed |
| Blog on a separate domain | Prior public website review | 2026-11-11 | Operations/Marketing | CANDIDATE | Ownership, export rights, canonical URLs and migration inventory not confirmed |
| Featured branch links and public branch listings | Prior public website review | 2026-11-11 | Operations | CANDIDATE | Counts differed across listings; must import as unpublished candidates |

---

## Branch data (all CANDIDATE — not verified)

No authoritative branch register has been supplied. All branch data must be supplied by Operations and verified before publication.

**Required for each branch:**
- Legal name (English and Arabic)
- Slug (URL-safe, unique)
- Full street address (English and Arabic)
- GPS coordinates (latitude, longitude)
- Phone number (E.164 format)
- Opening hours (by day, including overnight rules)
- Exceptional closures calendar
- Service codes enabled (pickup, dine-in, drive-through, delivery, catering)
- Branch-specific pricing exceptions (if any)
- POS mapping ID

---

## Menu and catalog (all CANDIDATE — not verified)

No authoritative SKU list, variant structure, modifier groups, allergen evidence or branch pricing has been supplied.

**Required before Phase 1 menu publish:**
- Product SKU list with English and Arabic names
- Category hierarchy with slugs
- Variants per product (size, type etc.) with base prices in AED fils
- Modifier groups with min/max selection rules and option prices
- Allergen codes per product with evidence references
- Product availability per branch (branch_products)

**Authority decision required:** Does the POS or the platform own catalog fields, prices and stock counts? (See DECISIONS.md D-003.)

---

## Pricing and tax (all CANDIDATE — not verified)

| Claim | Status | Owner | Notes |
|---|---|---|---|
| Currency: AED | CANDIDATE | Finance/Sponsor | Likely; requires explicit confirmation |
| Tax policy (inclusive/exclusive, rate, rounding) | NOT SUPPLIED | Finance | Blocks checkout totals calculation |
| Price display (inc/exc tax) | NOT SUPPLIED | Finance | Must be documented before checkout launch |
| Rounding and discount allocation method | NOT SUPPLIED | Finance | Must define one equation and test it |

---

## Integrations (all CANDIDATE — not verified)

| Integration | Status | Notes |
|---|---|---|
| POS vendor identity | NOT SUPPLIED | Operations must supply vendor name, API documentation and sandbox access |
| Payment gateway | NOT SUPPLIED | Finance must select provider and complete onboarding |
| Identity/OTP/MFA provider | NOT SUPPLIED | Engineering must choose and document |
| Maps provider | NOT SUPPLIED | Approved coordinates and API key restrictions required |
| Email/SMS/WhatsApp provider | NOT SUPPLIED | Provider approval, sending identities and consent rules required |
| Hosting provider and region | NOT SUPPLIED | Engineering and privacy reviewer |

---

## Content (all CANDIDATE — not verified)

| Item | Status | Owner | Notes |
|---|---|---|---|
| Approved English copy (all pages) | NOT SUPPLIED | Marketing | Required before Phase 1 launch |
| Approved Arabic copy (all pages) | NOT SUPPLIED | Marketing | Native reviewer required for checkout and transactional messages |
| Brand kit (logo, fonts, colors) | NOT SUPPLIED | Marketing | Required before design system is finalized |
| Product photography (licensed) | NOT SUPPLIED | Marketing | Required for menu and home page |
| Branch photography (licensed) | NOT SUPPLIED | Marketing | Required for branch detail pages |
| Privacy notice | NOT SUPPLIED | Legal/Privacy reviewer | Required before customer-facing launch |
| Terms of service | NOT SUPPLIED | Legal/Privacy reviewer | Required before customer-facing launch |
| Refund and cancellation policy | NOT SUPPLIED | Finance/Legal | Required before checkout launch |
| Allergen disclaimer | NOT SUPPLIED | Operations/Legal | Required before menu launch |

---

## Legacy URLs (not verified)

| URL | Status | Notes |
|---|---|---|
| /our-menu/ | CANDIDATE (reported present) | Needs redirect mapping review |
| /stores/ | CANDIDATE (reported 404 to fetcher) | Retest in browser; check redirects and server logs before concluding broken |
| Blog domain | NOT SUPPLIED | Requires ownership confirmation and migration inventory |

A complete redirect map must be created and reviewed before Phase 1 launch.

---

## Evidence sources

| Source ID | Description |
|---|---|
| SRC-001 | Milestones Coffee 2.0 Project Report v1.0, 2026-11-11 (master implementation brief) |
| SRC-002 | Planning conversation "Plan New Website" (ChatGPT 6af3ebca-b5b0-83ed-a5c8-a7e1158d90e4) — historical audit notes only |
| SRC-003 | Public website https://milestonescoffee.ae/ — requires full browser audit |

**Note:** SRC-002 observations are historical audit notes from a prior review, not proof of current operational capabilities. "Not observed" does not mean a feature is absent.

---

*Maintained by Engineering. Add a row for every fact that enters any codebase, seed file, CMS record or configuration before that fact is VERIFIED and publication-approved.*
