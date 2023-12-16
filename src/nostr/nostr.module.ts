import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from './entities/event.entity';
import { NostrController } from './nostr.controller';
import { NostrGateway } from './nostr.gateway';
import { PgEventRepository } from './repositories';
import { EventSearchRepository } from './repositories/event-search.repository';
import { GenericTagEntity } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity, GenericTagEntity])],
  controllers: [NostrController],
  providers: [PgEventRepository, EventSearchRepository, NostrGateway],
})
export class NostrModule {}
