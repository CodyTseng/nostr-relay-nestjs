import 'dotenv/config';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Express, static as ExpressStatic } from 'express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from '@/app.module';
import { Config } from '@/config';
import { CustomWebSocketAdapter } from '@/modules/nostr/gateway/custom-ws-adapter';
import { ConnectionManagerModule } from '@/modules/connection-manager/connection-manager.module';
import { ConnectionManagerService } from '@/modules/connection-manager/connection-manager.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: false,
    });

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

    app.use(helmet());
    app.enableCors();
    app.use(ExpressStatic(join(__dirname, '..', 'public')));
    
    const wsAdapter = new CustomWebSocketAdapter(app, configService);
    app.useWebSocketAdapter(wsAdapter);

    // Setup Swagger if enabled
    const swaggerConfig = configService.get('swagger');
    if (swaggerConfig?.enabled) {
      const config = new DocumentBuilder()
        .setTitle('Nostr Relay')
        .setDescription('Nostr relay API description')
        .setVersion('1.0')
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api', app, document);
    }

    const port = configService.get('port');
    const hostname = configService.get('hostname', { infer: true });

    await app.listen(port, hostname ?? '127.0.0.1');
    logger.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    logger.error('Error during application bootstrap:', error);
    process.exit(1);
  }
}

bootstrap();
