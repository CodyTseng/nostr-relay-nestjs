import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Filter } from '@nostr-relay/common';
import { LazyCache } from '@nostr-relay/core/dist/utils';
import { chain } from 'lodash';
import { Config } from 'src/config';
import { EventRepository } from '../../repositories/event.repository';
import { TEventIdWithScore } from '../../../types/event';

@Injectable()
export class EventService {
  private readonly findTopIdsResultCache:
    | LazyCache<string, Promise<TEventIdWithScore[]>>
    | undefined;

  constructor(
    private readonly eventRepository: EventRepository,
    config: ConfigService<Config, true>,
  ) {
    const filterResultCacheTtl = config.get('cache', {
      infer: true,
    }).filterResultCacheTtl;

    if (filterResultCacheTtl > 0) {
      this.findTopIdsResultCache = new LazyCache({
        max: 1000,
        ttl: filterResultCacheTtl,
      });
    }
  }

  async findTopIds(filters: Filter[]) {
    const collection = await Promise.all([
      ...filters.map((filter) => this.findTopIdsByFilter(filter)),
    ]);

    return chain(collection)
      .flatten()
      .uniqBy('id')
      .sortBy((item) => -item.score)
      .map('id')
      .take(1000)
      .value();
  }

  private async findTopIdsByFilter(filter: Filter) {
    const callback = async () => {
      return this.eventRepository.findTopIds(filter);
    };

    return this.findTopIdsResultCache
      ? this.findTopIdsResultCache.get(JSON.stringify(filter), callback)
      : callback();
  }
}
