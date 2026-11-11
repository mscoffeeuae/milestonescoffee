import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { parseApiEnv } from '@milestones/config';

async function bootstrap() {
  const env = parseApiEnv();

  const app = await NestFactory.create(AppModule, {
    logger: env.NODE_ENV === 'development' ? ['log', 'error', 'warn', 'debug'] : ['error', 'warn'],
  });

  app.setGlobalPrefix('api/v1');

  // Health check endpoint (unauthenticated)
  // Full health module implemented in Prompt 5

  await app.listen(env.API_PORT);
  console.log(`[Milestones API] Listening on port ${env.API_PORT}`);
}

bootstrap().catch((err) => {
  console.error('[Milestones API] Failed to start:', err);
  process.exit(1);
});
