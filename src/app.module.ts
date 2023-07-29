import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule, PinoLogger } from 'nestjs-pino';
import { loggerModuleFactory } from './common/utils/logger-module-factory';
import { TypeOrmLogger } from './common/utils/type-orm-logger';
import { Config, config } from './config';
import { NostrModule } from './nostr/nostr.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      cache: true,
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      useFactory: loggerModuleFactory,
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: (
        configService: ConfigService<Config, true>,
        logger: PinoLogger,
      ) => {
        const { url } = configService.get('database', { infer: true });
        return {
          type: 'postgres',
          url,
          autoLoadEntities: true,
          migrationsRun: true,
          migrations: ['dist/migrations/*.js'],
          logger: new TypeOrmLogger(logger),
          maxQueryExecutionTime: 150,
        };
      },
      inject: [ConfigService, PinoLogger],
    }),
    NostrModule,
  ],
})
export class AppModule {}
