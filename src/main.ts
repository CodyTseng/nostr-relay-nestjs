import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import { Express, static as ExpressStatic } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { Config } from './config';
import { NostrWsAdapter } from './nostr/nostr-ws.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableCors();
  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.useWebSocketAdapter(new NostrWsAdapter(app));

  app.use('/favicon.ico', ExpressStatic('./resources/favicon.ico'));

  const express: Express = app.getHttpAdapter().getInstance();
  express.disable('x-powered-by');

  const configService = app.get(ConfigService<Config, true>);
  const port = configService.get('port', { infer: true });

  await app.listen(port);
}
bootstrap();
