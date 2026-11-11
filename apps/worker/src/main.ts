/**
 * Milestones Coffee — BullMQ Worker entry point
 *
 * Full job processors implemented in Prompt 8 (Branch operations, POS, notifications).
 * This stub establishes the entry point and graceful shutdown pattern.
 *
 * Job queues (implemented in Prompt 8):
 *   - outbox-dispatch     Provider notification dispatch from transactional outbox
 *   - pos-sync            POS catalog sync
 *   - notification-send   Email/SMS/WhatsApp delivery
 *   - reconciliation      Payment and order reconciliation
 */

import { parseApiEnv } from '@milestones/config';

async function start() {
  const env = parseApiEnv();

  console.log('[Milestones Worker] Starting…', {
    nodeEnv: env.NODE_ENV,
    redisUrl: env.REDIS_URL.replace(/:\/\/.*@/, '://***@'), // mask credentials
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[Milestones Worker] Received ${signal}, shutting down gracefully…`);
    // Workers are closed in Prompt 8
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  console.log('[Milestones Worker] Ready — awaiting jobs (full processors in Prompt 8)');
}

start().catch((err) => {
  console.error('[Milestones Worker] Failed to start:', err);
  process.exit(1);
});
