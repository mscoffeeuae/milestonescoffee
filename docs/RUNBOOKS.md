# Milestones Coffee 2.0 — Operational Runbooks

> **Audience**: DevOps / Engineering on-call, Engineering leads  
> **Last updated**: Prompt 12 (Release validation and handover)
>
> These runbooks assume the production stack is running as described in
> `docs/DEPLOYMENT.md` and `docker-compose.prod.yml`. All commands that
> touch the live environment must be run via Claude Code (never copy-pasted
> into a terminal from a chat session).

---

## R-01 — Deployment

**When**: Releasing a new version to staging or production.

### Pre-deployment checklist

- [ ] All CI jobs passing on `main` (lint, typecheck, tests, migration-check, build, docker-build)
- [ ] `IMAGE_TAG` noted from the passing Docker build job (e.g. `git-a1b2c3d`)
- [ ] Migration diff reviewed in the `migration-check` CI job output — confirm no destructive operations (DROP COLUMN, DROP TABLE, truncates)
- [ ] Feature flags for unready features confirmed **disabled** on target branches (see R-08)
- [ ] Rollback tag identified (the previous `IMAGE_TAG` in production — keep it in your deploy notes)
- [ ] Notify team of deploy window (minimum 30 min before for production)

### Deployment steps

```bash
# 1. Pull and start the new images (zero-downtime for api — 2 replicas)
IMAGE_TAG=git-<sha> docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d --no-deps api worker web admin studio

# 2. Watch health checks recover
docker compose -f docker-compose.prod.yml ps

# 3. Check API health
curl -s http://localhost:4000/health | jq .

# 4. Tail logs for the first 2 minutes
docker compose -f docker-compose.prod.yml logs -f --tail=100 api worker
```

### Post-deployment verification

- [ ] `GET /health` on API returns `{"status":"ok"}`
- [ ] `GET /api/health` on web and admin returns 200
- [ ] Manual smoke test: load the customer homepage, load the admin login screen
- [ ] Check Sentry — no new error burst in the 5 minutes after deploy
- [ ] Database migration completed (check API startup logs for `All migrations applied`)

If anything fails → **immediately execute R-09 (Rollback)**.

---

## R-02 — Backup and Restore

**When**: Scheduled daily backup, before destructive operations, or during incident recovery.

### Scheduled backup (automated)

Backups should be scheduled via your hosting provider's managed PostgreSQL backup feature
(e.g. DigitalOcean Managed Databases, RDS automated snapshots).  
For the Docker Compose stack, use this script:

```bash
#!/usr/bin/env bash
# backup-postgres.sh — run as a daily cron job
set -euo pipefail

BACKUP_DIR="/var/backups/milestones"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/milestones_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres \
  pg_dump -U milestones milestones \
  | gzip > "$BACKUP_FILE"

echo "Backup written to $BACKUP_FILE"

# Prune backups older than 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

Upload `$BACKUP_FILE` to your S3-compatible object store immediately after creation.  
Retention policy: **daily for 30 days, weekly for 3 months**.

### Manual backup before a migration or risky operation

```bash
docker compose exec -T postgres \
  pg_dump -U milestones milestones \
  | gzip > /tmp/milestones_pre_deploy_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore from backup

```bash
# 1. Stop application services (keep postgres running)
docker compose -f docker-compose.prod.yml stop api worker web admin

# 2. Drop and recreate the database
docker compose exec postgres \
  psql -U milestones -c "DROP DATABASE milestones; CREATE DATABASE milestones;"

# 3. Restore
gunzip -c /path/to/backup.sql.gz \
  | docker compose exec -T postgres psql -U milestones milestones

# 4. Restart services
IMAGE_TAG=<known-good-tag> docker compose \
  -f docker-compose.yml -f docker-compose.prod.yml \
  up -d api worker web admin
```

### Verify restore

```bash
docker compose exec postgres \
  psql -U milestones milestones -c "SELECT COUNT(*) FROM customers;"
```

---

## R-03 — Database migration (manual apply)

**When**: Applying a migration that failed during automated deploy, or manual ops.

```bash
# Dry-run first (never skip this step)
docker compose exec api \
  node node_modules/.bin/prisma migrate diff \
    --from-url "$DATABASE_URL" \
    --to-schema-datamodel ./prisma/schema.prisma

# Apply
docker compose exec api \
  node node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma
```

> **Safety**: `migrate deploy` only applies unapplied migrations in order. It never
> rolls back applied ones. If you need to undo a migration, restore from backup (R-02)
> and redeploy the previous image (R-09).

---

## R-04 — Redis cache flush

**When**: Stale cached data is causing incorrect responses; after a cache strategy change.

```bash
# Flush ALL keys (use with caution in production — will increase DB load temporarily)
docker compose exec redis redis-cli FLUSHDB

# Flush only a specific key pattern (safer)
docker compose exec redis redis-cli --scan --pattern "milestones:menu:*" \
  | xargs docker compose exec -T redis redis-cli DEL
```

BullMQ queues are stored in Redis. Flushing FLUSHDB will also delete all queued jobs.
To drain queues gracefully before flushing, use the BullMQ Board admin or the Bull CLI.

---

## R-05 — Worker queue inspection

**When**: Jobs are stuck, failing, or delayed.

```bash
# Count jobs in each state
docker compose exec redis redis-cli \
  llen "bull:order-processing:wait" \
  llen "bull:order-processing:active" \
  llen "bull:order-processing:failed"

# Worker logs
docker compose -f docker-compose.prod.yml logs worker --tail=200
```

To retry failed jobs, use the BullMQ Board dashboard (requires separate setup)
or write a one-off script using `@milestones/database` and BullMQ's `Queue.retryJobs()`.

---

## R-06 — Scale API replicas

**When**: Under load; before a marketing campaign; after a performance incident.

```bash
# Scale to 4 replicas
docker compose -f docker-compose.prod.yml scale api=4

# Back to 2
docker compose -f docker-compose.prod.yml scale api=2
```

Ensure your reverse proxy (nginx/Caddy/Traefik) is configured for load balancing
across the API containers.

---

## R-07 — Health check and monitoring

**Endpoints**:

| Service | Health URL | Expected response |
|---------|-----------|-------------------|
| API | `http://api:4000/health` | `{"status":"ok","uptime":<n>}` |
| Web | `http://web:3000/api/health` | HTTP 200 |
| Admin | `http://admin:3001/api/health` | HTTP 200 |

**Alert conditions** (configure in your monitoring tool):

- API health check failing for > 60 s → page on-call
- Worker queue depth > 500 jobs → alert engineering
- Database connection failures > 5/min → page on-call
- 5xx error rate > 1% over 5 min → alert engineering
- Sentry new issue spike (> 10 new issues in 5 min) → alert engineering

---

## R-08 — Feature flag management

**When**: Enabling/disabling a feature for a specific branch; investigating a feature issue.

Feature flags are per-branch on/off switches stored in `BranchFeatureFlag`. All flags
default to **disabled** (a missing record = false).

**Known flags**: `ordering`, `loyalty`, `gift_cards`, `subscriptions`, `qr_ordering`,
`recommendations`, `shop`

### Via the Admin API

```bash
# Enable 'ordering' for branch branch-dubai-marina
curl -X PUT https://api.milestones.ae/admin/branches/branch-dubai-marina/feature-flags/ordering \
  -H "Authorization: Bearer <HQ_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Check all flags for a branch
curl -s https://api.milestones.ae/admin/branches/branch-dubai-marina/feature-flags \
  -H "Authorization: Bearer <HQ_JWT>" | jq .
```

### Direct database (emergency only — log the change)

```sql
-- Enable a flag
INSERT INTO branch_feature_flags (id, branch_id, flag, enabled, updated_at, updated_by_staff_id)
VALUES (gen_random_uuid(), 'branch-dubai-marina', 'ordering', true, NOW(), 'admin-user-id')
ON CONFLICT (branch_id, flag) DO UPDATE SET enabled = true, updated_at = NOW();

-- Disable a flag
UPDATE branch_feature_flags
SET enabled = false, updated_at = NOW()
WHERE branch_id = 'branch-dubai-marina' AND flag = 'ordering';
```

> Always log any manual database change in your incident log with: timestamp, operator,
> reason, before/after values.

---

## R-09 — Rollback

**When**: A deploy causes errors, failed health checks, or data integrity concerns.

### Fast rollback (image tag)

```bash
# Identify the last known-good tag (check your deploy notes)
PREV_TAG=git-<previous-sha>

# Roll back application services only (database stays at current migration)
IMAGE_TAG=$PREV_TAG docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d --no-deps api worker web admin
```

> **Important**: Image rollbacks do NOT reverse database migrations. If the bad release
> included a schema migration, you must also restore the database from backup (R-02)
> before rolling back the image. Coordinate with Engineering lead.

### Decision tree

```
Deploy succeeded?
  NO → roll back image immediately (above)
  YES → errors within 15 min?
    YES → assess severity:
      Functional bug only → roll back image
      Data integrity concern → STOP traffic, restore DB from pre-deploy backup (R-02), then roll back image
    NO → monitor for 30 min, then confirm stable
```

### Post-rollback

- [ ] Confirm health checks green on rolled-back version
- [ ] Notify team of rollback
- [ ] File incident report within 24 h
- [ ] Root cause analysis before next deploy attempt

---

## R-10 — Security incident response

**When**: Suspected data breach, unauthorized access, credential exposure, or anomalous behaviour.

### Immediate containment (first 15 minutes)

```bash
# 1. Rotate the JWT secret immediately — all sessions will be invalidated
#    Update JWT_SECRET in your secret manager, then redeploy the API
IMAGE_TAG=<current-tag> docker compose \
  -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --no-deps --force-recreate api

# 2. If a staff account is suspected compromised, disable it
#    (via the Admin API — requires another HQ account)
curl -X PATCH https://api.milestones.ae/admin/staff/<staff-id>/disable \
  -H "Authorization: Bearer <HQ_JWT>"

# 3. If database credentials are suspected exposed, rotate them:
#    a. Update DATABASE_URL in secret manager
#    b. Redeploy all services
```

### Investigation steps

```bash
# Review recent API access logs (structured JSON logs from NestJS)
docker compose logs api --since=2h | jq 'select(.level == "warn" or .level == "error")'

# Check for anomalous QR scan patterns (high scan rate from single IP hash)
docker compose exec postgres psql -U milestones milestones -c "
  SELECT ip_hash, COUNT(*) as scans, MIN(scanned_at) as first, MAX(scanned_at) as last
  FROM qr_code_scan_logs
  WHERE scanned_at > NOW() - INTERVAL '1 hour'
  GROUP BY ip_hash
  HAVING COUNT(*) > 100
  ORDER BY scans DESC;
"

# Review failed auth attempts (rate limiting logs)
docker compose logs api --since=2h | jq 'select(.message | test("rate limit|unauthorized|forbidden"))'
```

### Notification obligations

Under UAE PDPL (Federal Decree-Law No. 45 of 2021), a personal data breach must be
reported to the UAE Data Office **within 72 hours** of becoming aware of it.

Notify:
1. Engineering Lead immediately
2. Legal/DPO within 1 hour
3. UAE Data Office within 72 hours if personal data affected
4. Affected customers as directed by Legal

Document everything with timestamps in your incident log.

---

## R-11 — Sanity CMS content incident

**When**: Published content is incorrect, offensive, or legally sensitive.

```bash
# Unpublish a document immediately via Sanity CLI (requires SANITY_AUTH_TOKEN)
npx sanity documents unpublish <document-id> \
  --dataset production \
  --project-id <SANITY_PROJECT_ID>
```

For menu price corrections: update via Sanity Studio; prices take effect on next CDN
revalidation (default: on-demand revalidation triggered by Sanity webhook).

> **Important**: CMS prices are display-only. Transactional prices (what customers are
> charged) live in the API's `ProductVariant.priceFils` column. Update both.

---

## Appendix — On-call escalation

| Severity | Response time | Escalation |
|----------|--------------|------------|
| P1 — All orders down / data breach | 15 min | Engineering Lead + CEO |
| P2 — Single branch down / payment failures | 30 min | Engineering Lead |
| P3 — Feature unavailable / high error rate | 2 hours | On-call engineer |
| P4 — Minor UI issues / non-critical bugs | Next business day | Engineering queue |
