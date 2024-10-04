import { Module } from '@nestjs/common';
import { EventSearchRepository } from './event-search.repository';
import { EventRepository } from './event.repository';
import { KyselyDb } from './kysely-db';
import { Nip05Repository } from './nip-05.repository';

@Module({
  providers: [
    KyselyDb,
    EventRepository,
    EventSearchRepository,
    Nip05Repository,
  ],
  exports: [EventRepository, EventSearchRepository, Nip05Repository],
})
export class RepositoriesModule {}
