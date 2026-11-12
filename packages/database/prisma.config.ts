import { defineConfig } from 'prisma/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
try { loadEnvFile(resolve(__dirname, '../../.env')) } catch { /* .env may not exist in CI */ }

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
  migrate: {
    async adapter(env) {
      const pool = new pg.Pool({ connectionString: env.DATABASE_URL })
      return new PrismaPg(pool)
    },
  },
})
