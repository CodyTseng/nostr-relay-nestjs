import { Module } from '@nestjs/common';
import { EventRepository } from './event.repository';
import { EventSearchRepository } from './event-search.repository';

@Module({
  providers: [EventRepository, EventSearchRepository],
  exports: [EventRepository, EventSearchRepository],
})
export class RepositoriesModule {}
