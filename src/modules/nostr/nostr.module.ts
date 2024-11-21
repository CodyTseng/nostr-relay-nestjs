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
import { ReportEventValidator } from './validators/report-event.validator';

@Module({
  imports: [ShareModule, RepositoriesModule, WotModule, MetricModule],
  controllers: [NostrController, EventController],
  providers: [NostrGateway, EventService, NostrRelayService, ReportEventValidator],
  exports: [NostrRelayService],
})
export class NostrModule {}
