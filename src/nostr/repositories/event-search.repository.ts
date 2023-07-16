import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Index, MeiliSearch } from 'meilisearch';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Config } from '../../config';
import { Event } from '../entities';

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

  async add(event: Event) {
    if (!this.index) {
      return;
    }
    try {
      await this.index.addDocuments([this.toEventDocument(event)]);
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

  private toEventDocument(event: Event) {
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
}
