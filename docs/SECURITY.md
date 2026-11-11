# Security — Milestones Coffee 2.0

---

## Role model

| Role | Allowed scope | Important boundary |
|---|---|---|
| Super Admin | Platform configuration and approved global operations | MFA required; sensitive actions remain controlled; audit all |
| HQ Operations | All branches; operational orders and reports | No automatic access to secrets or finance settings |
| Branch Manager | Assigned branch orders and availability | Cannot query or modify other branches |
| Branch Staff | Assigned order queue and permitted transitions | No bulk customer export or financial configuration |
| Marketing | CMS, campaigns and approved segments | No payment credentials or unrestricted customer data |
| Finance | Reconciliation, permitted refunds and finance reports | Refund limits enforced; reason capture required |
| Customer | Own profile, orders, rewards and addresses | Object-level ownership enforced on every request |

---

## Authentication

### Customer auth
- Managed external identity provider (TBD — see DECISIONS.md D-004)
- Phone/email OTP flow
- Validate: access token + issuer + audience + expiry on every request
- Session lifecycle: refresh tokens scoped and rotatable
- Separate from staff authorization

### Staff auth
- Managed external identity provider (same or separate from customer — TBD)
- MFA enforced through provider policy (not optional)
- Least-privilege service identities
- Staff and customer identity systems must be strictly separated in authorization middleware

---

## Authorization

- Enforce at the API layer; never rely on the client to suppress UI
- Customer requests: verify resource ownership on every individual record, list query and mutation
- Staff requests: verify role permissions + branch scope (`staff_branch_assignments`)
- Guest cart tokens: high-entropy, scoped, short-lived
- Order tracking tokens: high-entropy; not sequential order numbers

---

## Transport and storage

- TLS required on all endpoints; no HTTP in production
- Encryption at rest for database and backups
- Secret manager for all provider credentials (never plaintext in env or code)
- Rotate provider secrets and API keys on a schedule
- Never store PAN or CVV — use provider-hosted or tokenized payment collection
- Gift card codes: store keyed digest only; mask in staff views; exclude from logs

---

## Input validation and output

- Validate all request input (body, query, params) using NestJS pipes + class-validator
- Output encoding: prevent injection in all rendered surfaces
- Secure headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options (configure in Nginx and Next.js)
- File uploads: validate type (allowlist) and size; virus scan if storing user files
- CORS: restrict to known origins; not wildcard in production

---

## CSRF and session protection

- CSRF: protect cookie-authenticated state changes using SameSite cookies + explicit CSRF tokens or token-in-header pattern
- Authentication is token-based (JWT); cookie transport for web must be httpOnly, Secure, SameSite=Strict/Lax
- Never expose auth tokens in URLs or client-visible logs

---

## Rate limiting and abuse

- Rate limit all public endpoints (branch search, menu, balance lookup)
- Aggressive rate limit on: OTP send, gift card balance lookup, corporate enquiry, feedback forms
- IP and account-level rate limiting
- BullMQ job retries with bounded exponential backoff; failure queue review
- Scheduled reconciliation for missing or delayed provider events

---

## Logging and audit

- Redact from logs: phone numbers, email addresses, tokens, gift card codes, payment card details, CVV
- Audit log (`audit_logs`) for: privileged changes, refunds, bulk exports, role changes, branch assignment changes
- Audit log entries: actor (staffId), action, target, branchId, redacted diff, timestamp
- Audit log: append only; restricted read; retention policy required (see Privacy section)
- Sentry: errors and traces; configure PII scrubbing before enabling

---

## Webhook security

- Verify all inbound webhooks using raw body + provider signature + timestamp tolerance
- Reject events outside the provider's replay window
- Store verified events in `webhook_inbox` before processing
- Deduplicate by provider+eventId before processing
- Never acknowledge a webhook and then fail to process it silently

---

## Idempotency

- All financial mutations: require Idempotency-Key header
- Scope keys by principal + operation
- Store requestHash; reject reuse with changed body (409)
- Persist intent before external call; record outcome after

---

## Privacy and consent

- Consent is purpose-specific (`customer_consents` table)
- Provide access, correction and deletion workflows (`customer_deletion_requests`)
- Restrict personal data access to minimum required fields per role
- Financial retention exceptions require explicit review and documented legal basis
- Marketing consent is separate from service/transactional notices

### UAE privacy requirements
**⚠️ This is an implementation controls document, not a legal determination.**  
A designated privacy/legal reviewer must assess:
- Applicable UAE privacy regulations
- Vendor data locations and international transfers
- Processor terms and sub-processor disclosures
- Retention periods (do not hardcode without legal approval)
- Customer notice requirements
- Tax rule implementation (do not hardcode without Finance approval)

---

## Deployment security

- Separate development, staging and production identities and secrets
- Never share production credentials with staging or development
- CI: gate deployment on tested builds and reviewed migrations
- Production database: never run destructive reset commands
- Dependencies: automated vulnerability scanning in CI (e.g., `pnpm audit`)
- Container images: minimal base images; no debug tools in production images

---

## Recovery and incident

- Backups: automated, tested, point-in-time recovery where hosting supports it
- Restore drills: documented, rehearsed
- Proposed RPO ≤ 15 minutes, RTO ≤ 4 hours (subject to hosting capability and owner approval)
- Feature rollback: financial records preserved; compatible migrations; forward repair documented
- Incident runbooks: in `docs/RUNBOOKS.md`
- Security incidents: separate escalation path to privacy/legal reviewer

---

## Open security decisions (blocked — see DECISIONS.md)

| Decision | Owner | Blocks |
|---|---|---|
| Identity provider selection | Engineering | All auth implementation |
| Payment gateway (PCI-DSS scope) | Finance | Checkout, tokenization |
| Hosting provider and region (data residency) | Engineering + Privacy reviewer | Production deployment |
| Retention periods (legal) | Privacy reviewer | Customer data deletion workflows |
| Tax rules (Finance approval) | Finance | Checkout totals |
