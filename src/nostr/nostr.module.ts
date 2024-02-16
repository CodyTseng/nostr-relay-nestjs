import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenericTagEntity } from './entities';
import { EventEntity } from './entities/event.entity';
import { NostrController } from './nostr.controller';
import { NostrGateway } from './nostr.gateway';
import { EventRepository } from './repositories';
import { EventSearchRepository } from './repositories/event-search.repository';
import { EventService } from './services/event.service';
import { NostrRelayLogger } from './services/nostr-relay-logger.service';
import { AccessControlPlugin } from './plugins';
import { MetricService } from './services/metric.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity, GenericTagEntity])],
  controllers: [NostrController],
  providers: [
    EventRepository,
    EventSearchRepository,
    NostrGateway,
    EventService,
    MetricService,
    NostrRelayLogger,
    AccessControlPlugin,
  ],
})
export class NostrModule {}
