import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { GlobalExceptionFilter } from './common/filters';
import { ParseNostrAuthorizationGuard } from './common/guards';
import { Config, config } from './config';
import { Nip05Module } from './modules/nip-05/nip-05.module';
import { NostrModule } from './modules/nostr/nostr.module';
import { TaskModule } from './modules/task/task.mdodule';
import { loggerModuleFactory } from './utils';

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
      useFactory: (configService: ConfigService<Config, true>) => {
        return configService.get('throttler.restApi', { infer: true });
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    NostrModule,
    Nip05Module,
    TaskModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: ParseNostrAuthorizationGuard },
  ],
})
export class AppModule {}
