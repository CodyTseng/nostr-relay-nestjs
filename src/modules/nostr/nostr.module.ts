import { Module } from '@nestjs/common';
import { MetricModule } from '../metric/metric.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { ShareModule } from '../share/share.module';
import { WotModule } from '../wot/wot.module';
import { EventController } from './controllers/event.controller';
import { NostrController } from './controllers/nostr.controller';
import { NostrGateway } from './gateway/nostr.gateway';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { EventService } from './services/event.service';
import { NostrRelayService } from './services/nostr-relay.service';
import { NostrValidatorService } from './services/nostr-validator.service';
import { GroupEventValidator } from './validators/group-event.validator';
import { ReportEventValidator } from './validators/report-event.validator';
import { ConnectionManagerModule } from '../connection-manager/connection-manager.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    RepositoriesModule,
    MetricModule,
    ShareModule,
    WotModule,
    ConnectionManagerModule,
    LoggerModule,
  ],
  controllers: [EventController, NostrController],
  providers: [
    EventService,
    NostrRelayService,
    NostrGateway,
    NostrValidatorService,
    ReportEventValidator,
    GroupEventValidator,
    LoggingInterceptor,
  ],
  exports: [EventService, NostrRelayService],
})
export class NostrModule {}
