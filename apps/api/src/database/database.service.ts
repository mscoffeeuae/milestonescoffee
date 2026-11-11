/**
 * DatabaseService — thin wrapper around the shared Prisma client.
 *
 * Extends the generated PrismaClient so NestJS can manage its lifecycle.
 * On application shutdown, $disconnect() is called to close the connection
 * pool cleanly before the process exits.
 */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { db, disconnect } from '@milestones/database';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  /** The underlying Prisma client instance. */
  readonly client = db;

  async onModuleInit(): Promise<void> {
    // $connect() is lazy in Prisma — the first query triggers it.
    // We call it explicitly here so startup fails fast if the DB is unreachable.
    try {
      await this.client.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database on startup', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await disconnect();
    this.logger.log('Database connection closed');
  }
}
