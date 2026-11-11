/**
 * PosService — POS integration adapter stub.
 *
 * ALL POS interactions throw NotImplementedException (501) with reference
 * to blocking decisions:
 *   D-003 — POS authority (platform vs POS as catalog of record)
 *   D-006 — POS vendor + API access
 *
 * What IS implemented:
 *   - WebhookInbox persistence for incoming POS events (raw body stored)
 *   - Adapter interface that future implementations must satisfy
 *   - Integration health check stub
 *
 * When D-003 and D-006 are resolved, replace the stub method bodies
 * with actual POS adapter calls. The interface contract below must be
 * preserved — it is the boundary between this service and all callers.
 */
import {
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface PosOrderSyncPayload {
  provider: string;
  externalOrderId: string;
  status: string;
  rawBody: Buffer;
  signature: string;
}

export interface PosHealthStatus {
  provider: string;
  connected: boolean;
  lastSyncAt: Date | null;
  message: string;
}

@Injectable()
export class PosService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Process incoming POS webhook event.
   * Raw body persisted to WebhookInbox for durability before processing.
   * Actual state sync deferred to D-003/D-006.
   */
  async processWebhook(payload: PosOrderSyncPayload): Promise<void> {
    // Persist raw webhook first (inbox pattern — durable before processing)
    await this.db.client.webhookInbox.create({
      data: {
        provider: payload.provider,
        eventType: 'pos.order.update',
        payload: payload.rawBody.toString('base64'),
        processed: false,
        receivedAt: new Date(),
      },
    });

    // ⚠ D-003/D-006 STUB
    throw new NotImplementedException(
      `POS webhook processing not configured — awaiting D-003 (POS authority) and D-006 (POS vendor: ${payload.provider})`,
    );
  }

  /**
   * Push a new order to the POS system.
   * Deferred to D-006.
   */
  async pushOrder(_orderId: string, _provider: string): Promise<void> {
    // ⚠ D-006 STUB
    throw new NotImplementedException(
      'POS order push not configured — awaiting D-006 (POS vendor selection)',
    );
  }

  /**
   * Check POS integration health.
   * Returns stub status until D-006 is resolved.
   */
  async getHealth(provider: string): Promise<PosHealthStatus> {
    return {
      provider,
      connected: false,
      lastSyncAt: null,
      message: `POS integration not configured — awaiting D-006 (POS vendor: ${provider})`,
    };
  }
}
