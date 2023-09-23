import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { NostrController } from './nostr.controller';
import { NostrGateway } from './nostr.gateway';
import { EventRepository } from './repositories';
import { EventSearchRepository } from './repositories/event-search.repository';
import { EventService } from './services/event.service';
import { StorageService } from './services/storage.service';
import { SubscriptionService } from './services/subscription.service';
import { GenericTag } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Event, GenericTag])],
  controllers: [NostrController],
  providers: [
    EventRepository,
    EventSearchRepository,
    NostrGateway,
    SubscriptionService,
    EventService,
    StorageService,
  ],
})
export class NostrModule {}
