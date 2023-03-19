import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import { Express } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { NostrWsAdapter } from './nostr/nostr-ws.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.useWebSocketAdapter(new NostrWsAdapter(app));

  const express: Express = app.getHttpAdapter().getInstance();
  express.disable('x-powered-by');

  await app.listen(3000);
}
bootstrap();
