/**
 * Development seed — safe reference data only.
 *
 * SAFETY RULES (from CLAUDE.md):
 *   - No invented branch addresses, prices, allergens, reviews, SKUs or brand claims.
 *   - All business data (branches, menu, allergens) must come from verified sources.
 *   - This file seeds only schema metadata and idempotent lookup values.
 *
 * To add real branches/menu: wait for business inputs — see docs/DECISIONS.md.
 */

import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/index.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  loadEnvFile(resolve(__dirname, '../../../.env'))
} catch {
  // .env may not exist in CI
}

const pool = new pg.Pool({ connectionString: process.env['DATABASE_URL'] })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // --- Schema metadata ---
  await prisma.schemaMeta.upsert({
    where: { key: 'schema_version' },
    update: { value: '1.0.0' },
    create: { key: 'schema_version', value: '1.0.0' },
  })

  await prisma.schemaMeta.upsert({
    where: { key: 'seed_env' },
    update: { value: process.env['NODE_ENV'] ?? 'development' },
    create: { key: 'seed_env', value: process.env['NODE_ENV'] ?? 'development' },
  })

  console.log('✅ Schema metadata seeded.')
  console.log('')
  console.log('ℹ️  No branch, menu, or pricing data seeded.')
  console.log('   Add real data once business inputs are confirmed — see docs/DECISIONS.md.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
