import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ParseNostrAuthorizationGuard } from './common/guards';
import { Config, config } from './config';
import { Nip05Module } from './modules/nip-05/nip-05.module';
import { NostrModule } from './modules/nostr/nostr.module';
import { TaskModule } from './modules/task/task.module';
import { WotModule } from './modules/wot/wot.module';
import { ConnectionManagerModule } from './modules/connection-manager/connection-manager.module';
import { LoggerModule } from './modules/logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      load: [config],
      cache: true,
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService<Config, true>) => {
        return configService.get('throttler.restApi', { infer: true });
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    NostrModule,
    Nip05Module,
    TaskModule,
    WotModule,
    ConnectionManagerModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ParseNostrAuthorizationGuard,
    },
  ],
})
export class AppModule {}
