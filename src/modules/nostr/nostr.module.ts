import { Module } from '@nestjs/common';
import { MetricModule } from '../metric/metric.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { ShareModule } from '../share/share.module';
import { WotModule } from '../wot/wot.module';
import { EventController } from './controllers/event.controller';
import { NostrController } from './controllers/nostr.controller';
import { NostrGateway } from './gateway/nostr.gateway';
import { EventService } from './services/event.service';
import { NostrRelayService } from './services/nostr-relay.service';
import { GroupEventValidator } from './validators/group-event.validator';
import { ReportEventValidator } from './validators/report-event.validator';
import { ConnectionManagerService } from './services/connection-manager.service';

@Module({
  imports: [RepositoriesModule, MetricModule, ShareModule, WotModule],
  controllers: [EventController, NostrController],
  providers: [
    EventService,
    NostrRelayService,
    NostrGateway,
    ReportEventValidator,
    GroupEventValidator,
    ConnectionManagerService,
  ],
  exports: [EventService, NostrRelayService],
})
export class NostrModule {}
