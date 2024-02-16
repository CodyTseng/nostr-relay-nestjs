import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import 'dotenv/config';
import { Express, static as ExpressStatic } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import { AppModule } from './app.module';
import { Config } from './config';
import { NostrWsAdapter } from './nostr/nostr-ws.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  app.useWebSocketAdapter(new NostrWsAdapter(app));

  app.use(helmet());
  app.enableCors();
  app.use((_req, res, next) => {
    res.setHeader('cross-origin-opener-policy', 'cross-origin');
    res.setHeader('cross-origin-resource-policy', 'cross-origin');
    next();
  });

  app.use('/favicon.ico', ExpressStatic('./resources/favicon.ico'));

  const express: Express = app.getHttpAdapter().getInstance();
  express.disable('x-powered-by');

  const configService = app.get(ConfigService<Config, true>);
  const port = configService.get('port', { infer: true });

  await app.listen(port);
}
bootstrap();
