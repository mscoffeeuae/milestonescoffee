/**
 * @milestones/database — Prisma client and database utilities
 *
 * ⚠️  DEPENDENCY BOUNDARY: This package may ONLY be imported by:
 *   - apps/api
 *   - apps/worker
 *
 * It must NEVER be imported by:
 *   - apps/web
 *   - apps/admin
 *   - packages/ui
 *   - packages/contracts
 *   - packages/i18n
 *   - packages/utilities
 *   - packages/config
 *
 * See docs/ARCHITECTURE.md for the full dependency boundary table.
 */

export { PrismaClient } from './generated/index.js';
export { db, disconnect } from './client.js';
export type { Prisma } from './generated/index.js';
// Enum exports (Prompt 11: QR codes, recommendations)
export { QrCodeType, QrCodeStatus, RecommendationEventType } from './generated/index.js';
