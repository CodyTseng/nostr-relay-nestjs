import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Event, Filter, getTimestampInSeconds } from '@nostr-relay/common';
import { isNil } from 'lodash';
import { Index, MeiliSearch } from 'meilisearch';
import {
  buildMeiliSearchFilter,
  buildMeiliSearchSort,
  FilterQuery,
} from 'meilisearch-helper';
import { Config } from '../../config';
import { TEventIdWithScore } from '../../types/event';

type EventFilterableAttributes =
  | 'id'
  | 'author'
  | 'createdAt'
  | 'kind'
  | 'genericTags'
  | 'delegator'
  | 'expiredAt'
  | 'dTagValue';

type EventSortableAttributes = 'createdAt';

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

type AdditionalEventDocumentFields = {
  author: string;
  genericTags: string[];
  expiredAt: number | null;
  dTagValue: string | null;
};

@Injectable()
export class EventSearchRepository implements OnApplicationBootstrap {
  private readonly index?: Index<EventDocument>;
  private readonly syncEventKinds: number[];

  constructor(
    private readonly logger: Logger,
    private readonly log: Logger,
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

    const result = await this.index.search(filter.search, {
      limit,
      filter: this.buildSearchFilter(filter),
      sort: buildMeiliSearchSort<EventSortableAttributes>({
        createdAt: -1,
      }),
    });

    return result.hits.map(this.toEvent);
  }

  async findTopIds(filter: Filter): Promise<TEventIdWithScore[]> {
    if (!this.index) return [];

    const limit = this.getLimitFrom(filter);
    if (limit === 0) return [];

    const searchFilters = this.buildSearchFilter(filter);

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

  async add(event: Event, additionalFields: AdditionalEventDocumentFields) {
    if (!this.index || !this.syncEventKinds.includes(event.kind)) return;

    try {
      await this.index.addDocuments([
        this.toEventDocument(event, additionalFields),
      ]);
    } catch (error) {
      this.log.error(error);
    }
  }

  async deleteReplaceableEvents(
    author: string,
    kind: number,
    dTagValue: string,
  ) {
    if (!this.index) return;

    try {
      await this.index.deleteDocuments({
        filter: buildMeiliSearchFilter<EventFilterableAttributes>({
          author,
          kind,
          dTagValue,
        }),
      });
    } catch (error) {
      this.log.error(error);
    }
  }

  private buildSearchFilter(filter: Filter): string {
    const filterQuery: FilterQuery<EventFilterableAttributes> = {
      $or: [
        { expiredAt: null },
        { expiredAt: { $gte: getTimestampInSeconds() } },
      ],
    };
    if (filter.ids?.length) {
      filterQuery.id = { $in: filter.ids };
    }
    if (filter.kinds?.length) {
      filterQuery.kind = { $in: filter.kinds };
    }
    if (filter.until || filter.since) {
      filterQuery.createdAt = {
        $gte: filter.since,
        $lte: filter.until,
      };
    }
    if (filter.authors?.length) {
      filterQuery.author = { $in: filter.authors };
    }
    const genericTagsCollection = this.extractGenericTagsCollectionFrom(filter);
    if (genericTagsCollection.length) {
      filterQuery.$and = [];
      genericTagsCollection.forEach((genericTags) => {
        filterQuery.$and?.push({ genericTags: { $in: genericTags } });
      });
    }
    if (filter['#d']?.length) {
      filterQuery.dTagValue = { $in: filter['#d'] };
    }

    return buildMeiliSearchFilter(filterQuery);
  }

  private getLimitFrom(filter: Filter, defaultLimit = 100) {
    return Math.min(isNil(filter.limit) ? defaultLimit : filter.limit, 1000);
  }

  private toEventDocument(
    event: Event,
    {
      author,
      genericTags,
      expiredAt,
      dTagValue,
    }: AdditionalEventDocumentFields,
  ): EventDocument {
    return {
      id: event.id,
      pubkey: event.pubkey,
      createdAt: event.created_at,
      kind: event.kind,
      tags: event.tags,
      genericTags,
      content: event.content,
      sig: event.sig,
      expiredAt,
      author,
      dTagValue,
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
      .filter((key) => key.startsWith('#') && key !== '#d')
      .map((key) => {
        const tagName = key[1];
        return filter[key].map((v: string) => `${tagName}:${v}`);
      });
  }
}
