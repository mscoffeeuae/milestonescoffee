# Design System — Milestones Coffee 2.0

**Status:** Pending brand approval. All specific values below are planning placeholders until the brand kit is supplied.

---

## Visual direction

Warm, premium coffee aesthetic:
- **Primary palette:** Espresso brown, ivory, restrained bronze
- **Typography:** TBD — requires approved font licenses
- **Photography:** Generous spacing with approved coffee imagery
- **Tone:** Premium, welcoming, Emirati heritage

**⚠️ All specific colors, fonts, logo usage and copy remain subject to brand approval before publication. Do not ship these placeholders as production values.**

---

## Required brand inputs (blocked — awaiting Marketing)

| Input | Status | Notes |
|---|---|---|
| Logo files (SVG, PNG variants) | NOT SUPPLIED | Required before any public page |
| Primary and secondary colors (hex/HSL) | NOT SUPPLIED | Espresso brown + ivory + bronze are directions only |
| Typography: heading font | NOT SUPPLIED | Must be licensed for web use |
| Typography: body font | NOT SUPPLIED | Must support Arabic script |
| Typography: Arabic font | NOT SUPPLIED | Native reviewer must approve readability |
| Approved photography | NOT SUPPLIED | Licensed product and branch imagery |
| Icon set | NOT SUPPLIED | Or specify to use a standard library |

---

## Technology stack

| Layer | Technology | Notes |
|---|---|---|
| Styling | Tailwind CSS | Configuration in `tailwind.config.ts` |
| Components | shadcn/ui | Accessible primitives; extends Radix UI |
| Animation | Motion (Framer Motion) | Respect `prefers-reduced-motion` |
| Component library | `packages/ui` | Shared across web and admin |

---

## Accessibility requirements

- **Target:** WCAG 2.2 AA
- Touch targets: minimum 44×44 px
- Keyboard navigation: all interactive elements reachable and operable
- Focus indicators: visible, high-contrast
- Color: never communicate state by color alone
- Screen reader: test with VoiceOver (iOS/macOS) and NVDA/JAWS (Windows)
- Reduced motion: `prefers-reduced-motion: reduce` must disable or significantly reduce animations
- RTL: Arabic pages must use `dir="rtl"` and CSS logical properties

---

## Bilingual implementation rules

- Use `lang` and `dir` attributes on `<html>` element
- CSS logical properties: `margin-inline-start/end`, `padding-inline-start/end` (not `left`/`right`)
- Number formatting: AED amounts use locale-aware formatting (`Intl.NumberFormat`)
- Date formatting: local dates use `Asia/Dubai` timezone
- Mirror directional controls (back/forward arrows, carousel directions) where appropriate
- Numbers, payment identifiers and maps: remain readable in LTR within RTL contexts
- Route context preserved on language switch (e.g., `/ar/menu/[category]` ↔ `/en/menu/[category]`)

---

## Component library — planned

All components live in `packages/ui` and must meet accessibility requirements.

### Form primitives
- `Button` (variants: primary, secondary, ghost, destructive; sizes: sm, md, lg)
- `Input` (text, email, tel, number)
- `Select`
- `Checkbox` / `RadioGroup`
- `Textarea`
- `Label`
- `FormField` (label + input + error message)

### Feedback and navigation
- `Dialog` / `AlertDialog`
- `Toast` / notification
- `Skeleton` (loading placeholder)
- `EmptyState` (empty list/search/account)
- `ErrorState` (network/server error with retry)
- `Badge`
- `Spinner`
- `Breadcrumb`
- `Pagination`

### Commerce
- `ProductCard` (image, name, price, branch availability indicator)
- `BranchCard` (name, distance, hours, services, map link)
- `CartItem` (product, modifiers, quantity controls, price)
- `OrderStatusBadge`
- `LoyaltyBalanceTile`

### Layout
- `Container` (max-width, responsive padding)
- `Section`
- `Grid`
- `Stack`

---

## Design tokens (placeholder — pending brand kit)

```ts
// tailwind.config.ts — extend with approved brand values
// These are directional only, not production values
colors: {
  brand: {
    espresso:   '#3B1F0E', // placeholder
    ivory:      '#F5F0E8', // placeholder
    bronze:     '#A0784A', // placeholder
  },
  neutral: { /* TBD */ },
  success: { /* TBD */ },
  warning: { /* TBD */ },
  error:   { /* TBD */ },
}
```

---

## Motion / animation principles

- Subtle, purposeful transitions only
- Durations: micro (100–150ms), standard (200–300ms), page (350–500ms)
- Easing: ease-out for entries, ease-in for exits
- Never animate content that communicates important state changes (use ARIA live regions instead)
- All animations must be wrapped in a `prefers-reduced-motion` check

---

## Page states (required for every data-driven view)

| State | Requirement |
|---|---|
| Loading | Skeleton component matching layout |
| Empty | Friendly message + call to action |
| Error | Descriptive message + retry action |
| Not found | 404 state with navigation |
| Unavailable | Service unavailable / maintenance |

---

## Performance and media

- Images: use Next.js `<Image>` with explicit width/height; lazy-load below fold
- Fonts: load via `next/font`; `font-display: swap`
- Icons: inline SVG or single sprite; not font icons
- LCP image: preload above-fold hero image
- No layout shift: reserve space for images and fonts

---

## Admin app design

The admin app shares the UI package for primitives but uses a separate neutral, high-density theme appropriate for operational use:
- Dense table layouts for order queues and reports
- Clear status indicators (order states, payment states)
- Destructive actions require confirmation dialogs
- Branch scope clearly indicated in navigation
