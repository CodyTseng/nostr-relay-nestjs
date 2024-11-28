import 'dotenv/config';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Express, static as ExpressStatic } from 'express';
import * as hbs from 'hbs';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import { AppModule } from './app.module';
import { Config } from './config';
import { createEnhancedWsAdapter } from './modules/nostr/gateway/enhanced-ws-adapter';
import { ConnectionManagerService } from './modules/nostr/services/connection-manager.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  hbs.registerHelper('json', (context) => JSON.stringify(context));
  app.setViewEngine('hbs');

  const connectionManager = app.get(ConnectionManagerService);
  const configService = app.get(ConfigService<Config, true>);
  const wsAdapter = createEnhancedWsAdapter(app, connectionManager, configService);
  app.useWebSocketAdapter(wsAdapter);

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

  const port = configService.get('port', { infer: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nostr Relay API')
    .setVersion('v1')
    .setDescription(
      'If you want to retrieve kind-4 events, you need to add an Authorization header with Nostr token. ' +
        'More details can be found in the [NIP-98](https://github.com/nostr-protocol/nips/blob/master/98.md).',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
}
bootstrap();
