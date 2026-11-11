/**
 * Singleton Prisma client for server-side use.
 * Never import this in web or admin apps.
 */
import { PrismaClient } from './generated/index.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });
}

// In development, reuse across HMR cycles.
// In production, create once per process.
export const db: PrismaClient =
  process.env['NODE_ENV'] === 'development'
    ? (globalThis.__prisma ??= createClient())
    : createClient();

if (process.env['NODE_ENV'] === 'development') {
  globalThis.__prisma = db;
}

export async function disconnect(): Promise<void> {
  await db.$disconnect();
}
