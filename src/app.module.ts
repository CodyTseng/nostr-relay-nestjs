import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { GlobalExceptionFilter } from './common/filters';
import { loggerModuleFactory } from './common/utils/logger-module-factory';
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
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService<Config, true>) =>
        configService.get('throttler', { infer: true }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    NostrModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: GlobalExceptionFilter }],
})
export class AppModule {}
