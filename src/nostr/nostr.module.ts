import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { NostrController } from './nostr.controller';
import { NostrGateway } from './nostr.gateway';
import { EventRepository } from './repositories';
import { EventSearchRepository } from './repositories/event-search.repository';
import { EventService } from './services/event.service';
import { LockService } from './services/lock.service';
import { SubscriptionService } from './services/subscription.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  controllers: [NostrController],
  providers: [
    EventRepository,
    EventSearchRepository,
    NostrGateway,
    SubscriptionService,
    EventService,
    LockService,
  ],
})
export class NostrModule {}
