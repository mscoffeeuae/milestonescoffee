/**
 * DatabaseModule — provides the PrismaClient singleton to all feature modules.
 *
 * Import this module (not PrismaClient directly) in every feature module that
 * needs database access. The exported DatabaseService wraps db from
 * @milestones/database and handles graceful shutdown.
 *
 * DEPENDENCY BOUNDARY: This module must ONLY be used inside apps/api and apps/worker.
 */
import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service.js';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
