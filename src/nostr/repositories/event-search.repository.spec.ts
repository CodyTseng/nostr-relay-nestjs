import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import {
  CAUSE_ERROR_EVENT_DTO,
  REGULAR_EVENT,
  REPLACEABLE_EVENT,
} from '../../../seeds';
import { Event } from '../entities';
import { EventSearchRepository } from './event-search.repository';

jest.mock('../utils/time', () => ({
  getTimestampInSeconds: jest.fn(() => 1620000000),
}));

describe('EventSearchRepository', () => {
  let eventSearchRepositoryWithIndex: EventSearchRepository,
    eventSearchRepositoryWithoutIndex: EventSearchRepository;
  let updateSettingsInput: any,
    searchInput: any,
    addDocumentsInput: any,
    deleteDocumentsInput: any;
  let logError: Error | undefined;

  const REGULAR_EVENT_DOCUMENT = {
    id: REGULAR_EVENT.id,
    pubkey: REGULAR_EVENT.pubkey,
    createdAt: REGULAR_EVENT.createdAt,
    kind: REGULAR_EVENT.kind,
    tags: REGULAR_EVENT.tags,
    genericTags: REGULAR_EVENT.genericTags,
    content: REGULAR_EVENT.content,
    sig: REGULAR_EVENT.sig,
    expiredAt: REGULAR_EVENT.expiredAt,
    delegator: REGULAR_EVENT.delegator,
    dTagValue: REGULAR_EVENT.dTagValue,
  };
  const REPLACEABLE_EVENT_DOCUMENT = {
    id: REPLACEABLE_EVENT.id,
    pubkey: REPLACEABLE_EVENT.pubkey,
    createdAt: REPLACEABLE_EVENT.createdAt,
    kind: REPLACEABLE_EVENT.kind,
    tags: REPLACEABLE_EVENT.tags,
    genericTags: REPLACEABLE_EVENT.genericTags,
    content: REPLACEABLE_EVENT.content,
    sig: REPLACEABLE_EVENT.sig,
    expiredAt: REPLACEABLE_EVENT.expiredAt,
    delegator: REPLACEABLE_EVENT.delegator,
    dTagValue: REPLACEABLE_EVENT.dTagValue,
  };
  const addDocumentsFailError = new Error('addDocuments fail');
  const deleteDocumentsFailError = new Error('deleteDocuments fail');
  const loggerMock = createMock<PinoLogger>({
    error: jest.fn((e: Error) => (logError = e)),
  });
  const indexMock = {
    updateSettings: (input) => (updateSettingsInput = input),
    search: (query, options) => {
      searchInput = {
        query,
        options,
      };
      return { hits: [{ ...REGULAR_EVENT_DOCUMENT, _rankingScore: 1 }] };
    },
    addDocuments: (eventDocuments) => {
      if (eventDocuments[0]?.id === CAUSE_ERROR_EVENT_DTO.id) {
        throw addDocumentsFailError;
      }
      addDocumentsInput = eventDocuments;
    },
    deleteDocuments: (ids) => {
      if (ids[0] === 'throwError') throw deleteDocumentsFailError;
      deleteDocumentsInput = ids;
    },
  };

  beforeEach(() => {
    eventSearchRepositoryWithIndex = new EventSearchRepository(
      loggerMock,
      createMock<ConfigService>({
        get: () => ({
          apiKey: 'apiKey',
          host: 'host',
          syncEventKinds: [0, 1, 30023],
        }),
      }),
    );
    (eventSearchRepositoryWithIndex as any).index = indexMock;
    eventSearchRepositoryWithoutIndex = new EventSearchRepository(
      loggerMock,
      createMock<ConfigService>({ get: () => ({}) }),
    );
  });

  afterEach(() => {
    updateSettingsInput = undefined;
    searchInput = undefined;
    addDocumentsInput = undefined;
    deleteDocumentsInput = undefined;
    logError = undefined;
  });

  describe('onApplicationBootstrap', () => {
    it('should not update index settings if no index', () => {
      eventSearchRepositoryWithoutIndex.onApplicationBootstrap();
      expect(updateSettingsInput).toBeUndefined();
    });

    it('should update index settings if has index', () => {
      eventSearchRepositoryWithIndex.onApplicationBootstrap();
      expect(updateSettingsInput).toEqual({
        searchableAttributes: ['content'],
        filterableAttributes: [
          'id',
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
          'createdAt:desc',
        ],
      });
    });
  });

  describe('find', () => {
    it('should return empty array if no index', async () => {
      const result = await eventSearchRepositoryWithoutIndex.find({
        search: '',
      });
      expect(result).toEqual([]);
    });

    it('only has search filter', async () => {
      const events = await eventSearchRepositoryWithIndex.find({
        search: 'search',
      });
      expect(searchInput).toEqual({
        query: 'search',
        options: {
          filter: [`expiredAt IS NULL OR expiredAt >= 1620000000`],
          sort: ['createdAt:desc'],
          limit: 100,
        },
      });
      expect(events[0].id).toEqual(REGULAR_EVENT.id);
    });

    it('has ids filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        ids: ['id1', 'id2'],
      });
      expect(searchInput).toEqual({
        query: '',
        options: {
          filter: [
            `expiredAt IS NULL OR expiredAt >= 1620000000`,
            `id IN [id1, id2]`,
          ],
          sort: ['createdAt:desc'],
          limit: 100,
        },
      });
    });

    it('has kinds filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        kinds: [1, 2],
      });
      expect(searchInput).toEqual({
        query: '',
        options: {
          filter: [
            `expiredAt IS NULL OR expiredAt >= 1620000000`,
            `kind IN [1, 2]`,
          ],
          sort: ['createdAt:desc'],
          limit: 100,
        },
      });
    });

    it('has since filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        since: 1620000000,
      });
      expect(searchInput).toEqual({
        query: '',
        options: {
          filter: [
            `expiredAt IS NULL OR expiredAt >= 1620000000`,
            `createdAt >= 1620000000`,
          ],
          sort: ['createdAt:desc'],
          limit: 100,
        },
      });
    });

    it('has until filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        until: 1620000000,
      });
      expect(searchInput).toEqual({
        query: '',
        options: {
          filter: [
            `expiredAt IS NULL OR expiredAt >= 1620000000`,
            `createdAt <= 1620000000`,
          ],
          sort: ['createdAt:desc'],
          limit: 100,
        },
      });
    });

    it('has authors filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        authors: ['pubkey1', 'pubkey2'],
      });
      expect(searchInput).toEqual({
        query: '',
        options: {
          filter: [
            `expiredAt IS NULL OR expiredAt >= 1620000000`,
            `pubkey IN [pubkey1, pubkey2] OR delegator IN [pubkey1, pubkey2]`,
          ],
          sort: ['createdAt:desc'],
          limit: 100,
        },
      });
    });

    it('has genericTagsCollection filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        genericTagsCollection: [['a:genericTags'], ['b:genericTags']],
      });
      expect(searchInput).toEqual({
        query: '',
        options: {
          filter: [
            `expiredAt IS NULL OR expiredAt >= 1620000000`,
            `genericTags IN [a:genericTags]`,
            `genericTags IN [b:genericTags]`,
          ],
          sort: ['createdAt:desc'],
          limit: 100,
        },
      });
    });

    it('has limit', async () => {
      await eventSearchRepositoryWithIndex.find({ search: '', limit: 10 });
      expect(searchInput).toEqual({
        query: '',
        options: {
          filter: [`expiredAt IS NULL OR expiredAt >= 1620000000`],
          sort: ['createdAt:desc'],
          limit: 10,
        },
      });

      expect(
        await eventSearchRepositoryWithIndex.find({ search: '', limit: 0 }),
      ).toEqual([]);
    });

    it('has all filters', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: 'search',
        ids: ['id1', 'id2'],
        kinds: [1, 2],
        since: 1620000000,
        until: 1630000000,
        authors: ['pubkey1', 'pubkey2'],
        genericTagsCollection: [['a:genericTags'], ['b:genericTags']],
        limit: 10,
      });
      expect(searchInput).toEqual({
        query: 'search',
        options: {
          filter: [
            `expiredAt IS NULL OR expiredAt >= 1620000000`,
            `id IN [id1, id2]`,
            `kind IN [1, 2]`,
            `createdAt >= 1620000000`,
            `createdAt <= 1630000000`,
            `pubkey IN [pubkey1, pubkey2] OR delegator IN [pubkey1, pubkey2]`,
            `genericTags IN [a:genericTags]`,
            `genericTags IN [b:genericTags]`,
          ],
          sort: ['createdAt:desc'],
          limit: 10,
        },
      });
    });
  });

  describe('findTopIdsWithScore', () => {
    it('should return empty array if no index', async () => {
      const result =
        await eventSearchRepositoryWithoutIndex.findTopIdsWithScore({
          search: 'test',
        });
      expect(result).toEqual([]);
    });

    it('should return idsWithScore', async () => {
      const result = await eventSearchRepositoryWithIndex.findTopIdsWithScore({
        search: 'test',
      });
      expect(result).toEqual([
        {
          id: REGULAR_EVENT_DOCUMENT.id,
          score: REGULAR_EVENT_DOCUMENT.createdAt * 2,
        },
      ]);
    });

    it('should return empty array', async () => {
      const result = await eventSearchRepositoryWithIndex.findTopIdsWithScore({
        search: 'test',
        limit: 0,
      });
      expect(result).toEqual([]);
    });
  });

  describe('add', () => {
    it('should not add documents if no index', async () => {
      await eventSearchRepositoryWithoutIndex.add(REGULAR_EVENT);
      expect(addDocumentsInput).toBeUndefined();
    });

    it('should add documents if has index', async () => {
      await eventSearchRepositoryWithIndex.add(REGULAR_EVENT);
      expect(addDocumentsInput).toEqual([REGULAR_EVENT_DOCUMENT]);
    });

    it('should throw error if addDocuments failed', async () => {
      await eventSearchRepositoryWithIndex.add(
        Event.fromEventDto(CAUSE_ERROR_EVENT_DTO),
      );
      expect(logError).toEqual(addDocumentsFailError);
    });
  });

  describe('deleteMany', () => {
    it('should not delete documents if no index', async () => {
      await eventSearchRepositoryWithoutIndex.deleteMany(['id']);
      expect(deleteDocumentsInput).toBeUndefined();
    });

    it('should delete documents if has index', async () => {
      await eventSearchRepositoryWithIndex.deleteMany(['id']);
      expect(deleteDocumentsInput).toEqual(['id']);
    });

    it('should throw error if deleteDocuments failed', async () => {
      await eventSearchRepositoryWithIndex.deleteMany(['throwError']);
      expect(logError).toEqual(deleteDocumentsFailError);
    });
  });

  describe('replace', () => {
    it('should do nothing if no index', async () => {
      await eventSearchRepositoryWithoutIndex.replace(REGULAR_EVENT);
      expect(deleteDocumentsInput).toBeUndefined();
      expect(addDocumentsInput).toBeUndefined();
    });

    it('should delete and add documents if has index', async () => {
      await eventSearchRepositoryWithIndex.replace(
        REPLACEABLE_EVENT,
        'oldEventId',
      );
      expect(deleteDocumentsInput).toEqual(['oldEventId']);
      expect(addDocumentsInput).toEqual([REPLACEABLE_EVENT_DOCUMENT]);
    });

    it('should not delete if no oldEventId', async () => {
      await eventSearchRepositoryWithIndex.replace(REPLACEABLE_EVENT);
      expect(deleteDocumentsInput).toBeUndefined();
      expect(addDocumentsInput).toEqual([REPLACEABLE_EVENT_DOCUMENT]);
    });
  });
});
