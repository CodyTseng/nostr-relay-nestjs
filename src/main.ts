import 'dotenv/config';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Express, static as ExpressStatic } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import { AppModule } from '@/app.module';
import { Config } from '@/config';
import { CustomWebSocketAdapter } from '@/modules/nostr/gateway/custom-ws-adapter';
import { ConnectionManagerModule } from '@/modules/connection-manager/connection-manager.module';
import { ConnectionManagerService } from '@/modules/connection-manager/connection-manager.service';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: true,
      logger: false, // Disable default logger
    });
    
    // Initialize Pino logger
    app.useLogger(app.get(Logger));

    // Set up view engine
    app.setBaseViewsDir(join(__dirname, '..', 'views'));
    app.setViewEngine('hbs');
    
    // Register Handlebars helpers after engine is set
    const handlebars = require('hbs');
    handlebars.registerHelper('json', function(context) {
      return JSON.stringify(context);
    });

    const moduleRef = app.select(ConnectionManagerModule);
    const connectionManager = moduleRef.get(ConnectionManagerService);
    const configService = app.get(ConfigService<Config, true>);
    const wsAdapter = new CustomWebSocketAdapter(app, connectionManager, configService);
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
    const hostname = configService.get('hostname', { infer: true });

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

    await app.listen(port, hostname ?? '127.0.0.1');
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    console.error('Error during application bootstrap:', error);
    process.exit(1);
  }
}
bootstrap();
