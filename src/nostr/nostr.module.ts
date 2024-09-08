import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { NostrController } from './nostr.controller';
import { NostrGateway } from './nostr.gateway';
import { AccessControlPlugin } from './plugins';
import { EventRepository } from './repositories';
import { EventSearchRepository } from './repositories/event-search.repository';
import { EventService } from './services/event.service';
import { MetricService } from './services/metric.service';
import { NostrRelayLogger } from './services/nostr-relay-logger.service';
import { NostrRelayService } from './services/nostr-relay.service';
import { TaskService } from './services/task.service';
import { WotController } from './wot.controller';

@Module({
  controllers: [NostrController, EventController, WotController],
  providers: [
    EventRepository,
    EventSearchRepository,
    NostrGateway,
    EventService,
    MetricService,
    NostrRelayLogger,
    AccessControlPlugin,
    TaskService,
    NostrRelayService,
  ],
})
export class NostrModule {}
