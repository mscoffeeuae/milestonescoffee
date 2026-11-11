import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    // DatabaseModule is @Global — provides DatabaseService to all feature modules.
    DatabaseModule,
    // Public endpoints only. Full auth wiring in Prompt 7.
    AuthModule,
    // Infrastructure
    HealthModule,
  ],
})
export class AppModule {}
