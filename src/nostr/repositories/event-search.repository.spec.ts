import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import {
  REGULAR_EVENT,
  REPLACEABLE_EVENT,
  createTestEvent,
} from '../../../seeds';
import { EventSearchRepository } from './event-search.repository';

jest.mock('../utils/time', () => ({
  getTimestampInSeconds: jest.fn(() => 1620000000),
}));

describe('EventSearchRepository', () => {
  let eventSearchRepositoryWithIndex: EventSearchRepository,
    eventSearchRepositoryWithoutIndex: EventSearchRepository;
  const mockUpdateSettings = jest.fn();
  const mockSearch = jest.fn();
  const mockAddDocuments = jest.fn();
  const mockDeleteDocuments = jest.fn();
  const logError = jest.fn();

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
    author: REGULAR_EVENT.author,
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
    author: REPLACEABLE_EVENT.author,
    dTagValue: REPLACEABLE_EVENT.dTagValue,
  };

  beforeEach(() => {
    const loggerMock = createMock<PinoLogger>({
      error: logError,
    });
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
    (eventSearchRepositoryWithIndex as any).index = {
      updateSettings: mockUpdateSettings,
      search: mockSearch.mockResolvedValue({
        hits: [{ ...REGULAR_EVENT_DOCUMENT, _rankingScore: 1 }],
      }),
      addDocuments: mockAddDocuments,
      deleteDocuments: mockDeleteDocuments,
    };
    eventSearchRepositoryWithoutIndex = new EventSearchRepository(
      loggerMock,
      createMock<ConfigService>({ get: () => ({}) }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onApplicationBootstrap', () => {
    it('should not update index settings if no index', () => {
      eventSearchRepositoryWithoutIndex.onApplicationBootstrap();
      expect(mockUpdateSettings).not.toBeCalled();
    });

    it('should update index settings if has index', () => {
      eventSearchRepositoryWithIndex.onApplicationBootstrap();
      expect(mockUpdateSettings).toBeCalledWith({
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
      expect(mockSearch).toBeCalledWith('search', {
        filter: [`expiredAt IS NULL OR expiredAt >= 1620000000`],
        sort: ['createdAt:desc'],
        limit: 100,
      });
      expect(events[0].id).toEqual(REGULAR_EVENT.id);
    });

    it('has ids filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        ids: ['id1', 'id2'],
      });
      expect(mockSearch).toBeCalledWith('', {
        filter: [
          `expiredAt IS NULL OR expiredAt >= 1620000000`,
          `id IN [id1, id2]`,
        ],
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has kinds filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        kinds: [1, 2],
      });
      expect(mockSearch).toBeCalledWith('', {
        filter: [
          `expiredAt IS NULL OR expiredAt >= 1620000000`,
          `kind IN [1, 2]`,
        ],
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has since filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        since: 1620000000,
      });
      expect(mockSearch).toBeCalledWith('', {
        filter: [
          `expiredAt IS NULL OR expiredAt >= 1620000000`,
          `createdAt >= 1620000000`,
        ],
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has until filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        until: 1620000000,
      });
      expect(mockSearch).toBeCalledWith('', {
        filter: [
          `expiredAt IS NULL OR expiredAt >= 1620000000`,
          `createdAt <= 1620000000`,
        ],
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has authors filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        authors: ['pubkey1', 'pubkey2'],
      });
      expect(mockSearch).toBeCalledWith('', {
        filter: [
          `expiredAt IS NULL OR expiredAt >= 1620000000`,
          `author IN [pubkey1, pubkey2]`,
        ],
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has genericTagsCollection filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        genericTagsCollection: [['a:genericTags'], ['b:genericTags']],
      });
      expect(mockSearch).toBeCalledWith('', {
        filter: [
          `expiredAt IS NULL OR expiredAt >= 1620000000`,
          `genericTags IN [a:genericTags]`,
          `genericTags IN [b:genericTags]`,
        ],
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has dTagValues filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        dTagValues: ['dTagValue1', 'dTagValue2'],
      });
      expect(mockSearch).toBeCalledWith('', {
        filter: [
          `expiredAt IS NULL OR expiredAt >= 1620000000`,
          `dTagValue IN [dTagValue1, dTagValue2]`,
        ],
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has limit', async () => {
      await eventSearchRepositoryWithIndex.find({ search: '', limit: 10 });
      expect(mockSearch).toBeCalledWith('', {
        filter: [`expiredAt IS NULL OR expiredAt >= 1620000000`],
        sort: ['createdAt:desc'],
        limit: 10,
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
        dTagValues: ['dTagValue1', 'dTagValue2'],
        limit: 10,
      });
      expect(mockSearch).toBeCalledWith('search', {
        filter: [
          `expiredAt IS NULL OR expiredAt >= 1620000000`,
          `id IN [id1, id2]`,
          `kind IN [1, 2]`,
          `createdAt >= 1620000000`,
          `createdAt <= 1630000000`,
          `author IN [pubkey1, pubkey2]`,
          `genericTags IN [a:genericTags]`,
          `genericTags IN [b:genericTags]`,
          `dTagValue IN [dTagValue1, dTagValue2]`,
        ],
        sort: ['createdAt:desc'],
        limit: 10,
      });
    });
  });

  describe('findTopIdsWithScore', () => {
    it('should return empty array if no index', async () => {
      const result = await eventSearchRepositoryWithoutIndex.findTopIds({
        search: 'test',
      });
      expect(result).toEqual([]);
    });

    it('should return idsWithScore', async () => {
      const result = await eventSearchRepositoryWithIndex.findTopIds({
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
      const result = await eventSearchRepositoryWithIndex.findTopIds({
        search: 'test',
        limit: 0,
      });
      expect(result).toEqual([]);
    });
  });

  describe('add', () => {
    it('should not add documents if no index', async () => {
      await eventSearchRepositoryWithoutIndex.add(REGULAR_EVENT);
      expect(mockAddDocuments).not.toBeCalled();
    });

    it('should add documents if has index', async () => {
      await eventSearchRepositoryWithIndex.add(REGULAR_EVENT);
      expect(mockAddDocuments).toBeCalledWith([REGULAR_EVENT_DOCUMENT]);
    });

    it('should throw error if addDocuments failed', async () => {
      const addDocumentsFailError = new Error('addDocuments fail');
      jest
        .spyOn(eventSearchRepositoryWithIndex['index'] as any, 'addDocuments')
        .mockRejectedValue(addDocumentsFailError);
      await eventSearchRepositoryWithIndex.add(createTestEvent({}));
      expect(logError).toBeCalledWith(addDocumentsFailError);
    });
  });

  describe('deleteMany', () => {
    it('should not delete documents if no index', async () => {
      await eventSearchRepositoryWithoutIndex.deleteMany(['id']);
      expect(mockDeleteDocuments).not.toBeCalled();
    });

    it('should delete documents if has index', async () => {
      await eventSearchRepositoryWithIndex.deleteMany(['id']);
      expect(mockDeleteDocuments).toBeCalledWith(['id']);
    });

    it('should throw error if deleteDocuments failed', async () => {
      const deleteDocumentsFailError = new Error('deleteDocuments fail');
      mockDeleteDocuments.mockRejectedValue(deleteDocumentsFailError);
      await eventSearchRepositoryWithIndex.deleteMany(['throwError']);
      expect(logError).toBeCalledWith(deleteDocumentsFailError);
    });
  });

  describe('replace', () => {
    it('should do nothing if no index', async () => {
      await eventSearchRepositoryWithoutIndex.replace(REGULAR_EVENT);
      expect(mockDeleteDocuments).not.toBeCalled();
      expect(mockAddDocuments).not.toBeCalled();
    });

    it('should delete and add documents if has index', async () => {
      await eventSearchRepositoryWithIndex.replace(
        REPLACEABLE_EVENT,
        'oldEventId',
      );
      expect(mockDeleteDocuments).toBeCalledWith(['oldEventId']);
      expect(mockAddDocuments).toBeCalledWith([REPLACEABLE_EVENT_DOCUMENT]);
    });

    it('should not delete if no oldEventId', async () => {
      await eventSearchRepositoryWithIndex.replace(REPLACEABLE_EVENT);
      expect(mockDeleteDocuments).not.toBeCalled();
      expect(mockAddDocuments).toBeCalledWith([REPLACEABLE_EVENT_DOCUMENT]);
    });
  });
});
