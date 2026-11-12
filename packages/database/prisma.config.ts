import { defineConfig } from 'prisma/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

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
