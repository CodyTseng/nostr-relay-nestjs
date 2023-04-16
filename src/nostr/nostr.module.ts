import { Module } from '@nestjs/common';
import { MongoRepositoriesModule } from './mongo-repositories/mongo-repositories.module';
import { NostrController } from './nostr.controller';
import { NostrGateway } from './nostr.gateway';
import { EventService } from './services/event.service';
import { LockService } from './services/lock.service';
import { SubscriptionService } from './services/subscription.service';

@Module({
  imports: [MongoRepositoriesModule],
  controllers: [NostrController],
  providers: [NostrGateway, SubscriptionService, EventService, LockService],
})
export class NostrModule {}
