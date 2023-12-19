import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Event, Filter, getTimestampInSeconds } from '@nostr-relay/common';
import { isNil } from 'lodash';
import { Index, MeiliSearch } from 'meilisearch';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Config } from '../../config';
import { EventEntity } from '../entities';
import { TEventIdWithScore } from '../types';

type EventDocument = {
  id: string;
  pubkey: string;
  author: string;
  createdAt: number;
  kind: number;
  tags: string[][];
  genericTags: string[];
  content: string;
  sig: string;
  expiredAt: number | null;
  dTagValue: string | null;
};

@Injectable()
export class EventSearchRepository implements OnApplicationBootstrap {
  private readonly index?: Index<EventDocument>;
  private readonly syncEventKinds: number[];

  constructor(
    @InjectPinoLogger(EventSearchRepository.name)
    private readonly logger: PinoLogger,
    configService: ConfigService<Config, true>,
  ) {
    const { host, apiKey, syncEventKinds } = configService.get('meiliSearch', {
      infer: true,
    });
    this.syncEventKinds = syncEventKinds;

    if (!host || !apiKey) return;

    this.index = new MeiliSearch({ host, apiKey }).index('events');
  }

  async onApplicationBootstrap() {
    if (!this.index) return;

    await this.index.updateSettings({
      searchableAttributes: ['content'],
      filterableAttributes: [
        'id',
        'author',
        'createdAt',
        'kind',
        'genericTags',
        'delegator',
        'expiredAt',
        'dTagValue',
      ],
      sortableAttributes: ['createdAt'],
      rankingRules: [
        'sort',
        'words',
        'typo',
        'proximity',
        'attribute',
        'exactness',
        'createdAt:desc',
      ],
    });
  }

  async find(filter: Filter): Promise<Event[]> {
    if (!this.index) return [];

    const limit = this.getLimitFrom(filter);
    if (limit === 0) return [];

    const searchFilters = this.buildSearchFilters(filter);

    const result = await this.index.search(filter.search, {
      limit,
      filter: searchFilters,
      sort: ['createdAt:desc'],
    });

    return result.hits.map(this.toEvent);
  }

  async findTopIdsWithScore(filter: Filter): Promise<TEventIdWithScore[]> {
    if (!this.index) return [];

    const limit = this.getLimitFrom(filter);
    if (limit === 0) return [];

    const searchFilters = this.buildSearchFilters(filter);

    const result = await this.index.search(filter.search, {
      limit,
      filter: searchFilters,
      attributesToRetrieve: ['id', 'createdAt'],
      showRankingScore: true,
    });

    // TODO: algorithm to calculate score
    return result.hits.map((hit) => ({
      id: hit.id,
      score: hit.createdAt * (1 + (hit._rankingScore ?? 0)),
    }));
  }

  async add(event: EventEntity) {
    if (!this.index || !this.syncEventKinds.includes(event.kind)) return;

    try {
      await this.index.addDocuments([this.toEventDocument(event)]);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async deleteMany(eventIds: string[]) {
    if (!this.index) return;

    try {
      await this.index.deleteDocuments(eventIds);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async replace(event: EventEntity, oldEventId?: string) {
    if (!this.index) return;

    await Promise.all([
      this.add(event),
      oldEventId ? this.deleteMany([oldEventId]) : undefined,
    ]);
  }

  private buildSearchFilters(filter: Filter): string[] {
    const searchFilters: string[] = [
      `expiredAt IS NULL OR expiredAt >= ${getTimestampInSeconds()}`,
    ];

    if (filter.ids?.length) {
      searchFilters.push(`id IN [${filter.ids.join(', ')}]`);
    }

    if (filter.kinds?.length) {
      searchFilters.push(`kind IN [${filter.kinds.join(', ')}]`);
    }

    if (filter.since) {
      searchFilters.push(`createdAt >= ${filter.since}`);
    }

    if (filter.until) {
      searchFilters.push(`createdAt <= ${filter.until}`);
    }

    if (filter.authors?.length) {
      searchFilters.push(`author IN [${filter.authors.join(', ')}]`);
    }

    const genericTagsCollection = this.extractGenericTagsCollectionFrom(filter);
    if (genericTagsCollection.length) {
      genericTagsCollection.forEach((genericTags) => {
        searchFilters.push(`genericTags IN [${genericTags.join(', ')}]`);
      });
    }

    if (filter['#d']?.length) {
      searchFilters.push(`dTagValue IN [${filter['#d'].join(', ')}]`);
    }

    return searchFilters;
  }

  private getLimitFrom(filter: Filter, defaultLimit = 100) {
    return Math.min(isNil(filter.limit) ? defaultLimit : filter.limit, 1000);
  }

  private toEventDocument(event: EventEntity): EventDocument {
    return {
      id: event.id,
      pubkey: event.pubkey,
      createdAt: event.createdAt,
      kind: event.kind,
      tags: event.tags,
      genericTags: event.genericTags,
      content: event.content,
      sig: event.sig,
      expiredAt: event.expiredAt,
      author: event.author,
      dTagValue: event.dTagValue,
    };
  }

  private toEvent(eventDocument: EventDocument): Event {
    return {
      id: eventDocument.id,
      pubkey: eventDocument.pubkey,
      created_at: eventDocument.createdAt,
      kind: eventDocument.kind,
      tags: eventDocument.tags,
      content: eventDocument.content,
      sig: eventDocument.sig,
    };
  }

  private extractGenericTagsCollectionFrom(filter: Filter): string[][] {
    return Object.keys(filter)
      .filter((key) => key.startsWith('#'))
      .map((key) => {
        const tagName = key[1];
        return filter[key].map((v: string) => `${tagName}:${v}`);
      });
  }
}
