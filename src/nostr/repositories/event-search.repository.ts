import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Index, MeiliSearch } from 'meilisearch';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Config } from '../../config';
import { SEARCHABLE_EVENT_KINDS } from '../constants';
import { Event, SearchFilter } from '../entities';
import { getTimestampInSeconds } from '../utils';

type EventDocument = {
  id: string;
  pubkey: string;
  createdAt: number;
  kind: number;
  tags: string[][];
  genericTags: string[];
  content: string;
  sig: string;
  expiredAt: number | null;
  delegator: string | null;
  dTagValue: string | null;
};

type EventRepositoryFilter = Pick<
  SearchFilter,
  | 'authors'
  | 'dTagValues'
  | 'genericTagsCollection'
  | 'kinds'
  | 'limit'
  | 'search'
  | 'searchOptions'
  | 'since'
  | 'until'
>;

@Injectable()
export class EventSearchRepository implements OnApplicationBootstrap {
  private readonly client?: MeiliSearch;
  private readonly index?: Index<EventDocument>;
  private readonly indexUid = 'events';

  constructor(
    @InjectPinoLogger(EventSearchRepository.name)
    private readonly logger: PinoLogger,
    configService: ConfigService<Config, true>,
  ) {
    const { host, apiKey } = configService.get('meiliSearch', { infer: true });
    if (!host || !apiKey) return;

    this.client = new MeiliSearch({ host, apiKey });
    this.index = this.client?.index(this.indexUid);
  }

  async onApplicationBootstrap() {
    if (!this.client) {
      return;
    }

    this.client.index(this.indexUid).updateSettings({
      searchableAttributes: ['content'],
      filterableAttributes: [
        'pubkey',
        'createdAt',
        'kind',
        'genericTags',
        'delegator',
        'expiredAt',
      ],
      sortableAttributes: ['createdAt'],
      rankingRules: [
        'sort',
        'words',
        'typo',
        'proximity',
        'attribute',
        'exactness',
      ],
    });
  }

  async find(filter: EventRepositoryFilter) {
    const searchFilters: string[] = [
      `expiredAt IS NULL OR expiredAt >= ${getTimestampInSeconds()}`,
    ];

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
      const authorsStr = filter.authors.join(', ');
      searchFilters.push(
        `pubkey IN [${authorsStr}] OR delegator IN [${authorsStr}]`,
      );
    }

    if (filter.genericTagsCollection?.length) {
      filter.genericTagsCollection.forEach((genericTags) => {
        searchFilters.push(`genericTags IN [${genericTags.join(', ')}]`);
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const result = await this.index!.search(filter.search, {
      limit: filter.limit,
      filter: searchFilters,
      sort: ['createdAt:desc'],
    });

    return result.hits.map(this.toEvent);
  }

  async add(event: Event) {
    if (!this.index || !SEARCHABLE_EVENT_KINDS.includes(event.kind)) {
      return;
    }
    try {
      await this.index.addDocuments([this.toEventDocument(event)]);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async replace(event: Event, oldEventId?: string) {
    if (!this.index) {
      return;
    }
    try {
      await Promise.all([
        this.add(event),
        oldEventId ? this.deleteMany([oldEventId]) : undefined,
      ]);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async deleteMany(eventIds: string[]) {
    if (!this.index) {
      return;
    }
    try {
      await this.index.deleteDocuments(eventIds);
    } catch (error) {
      this.logger.error(error);
    }
  }

  private toEventDocument(event: Event): EventDocument {
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
      delegator: event.delegator,
      dTagValue: event.dTagValue,
    };
  }

  private toEvent(eventDocument: EventDocument): Event {
    const event = new Event();
    event.id = eventDocument.id;
    event.pubkey = eventDocument.pubkey;
    event.createdAt = eventDocument.createdAt;
    event.kind = eventDocument.kind;
    event.tags = eventDocument.tags;
    event.content = eventDocument.content;
    event.sig = eventDocument.sig;
    event.expiredAt = eventDocument.expiredAt;
    event.genericTags = eventDocument.genericTags;
    event.dTagValue = eventDocument.dTagValue;
    event.delegator = eventDocument.delegator;

    event.createDate = new Date(eventDocument.createdAt);
    event.updateDate = new Date(eventDocument.createdAt);
    event.deleteDate = null;

    return event;
  }
}
