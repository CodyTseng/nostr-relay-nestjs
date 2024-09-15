import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { EventKind } from '@nostr-relay/common';
import { PinoLogger } from 'nestjs-pino';
import { createEvent } from '../../../test-utils/event';
import { EventSearchRepository } from './event-search.repository';

jest.mock('@nostr-relay/common', () => ({
  ...jest.requireActual('@nostr-relay/common'),
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

  const regularEvent = createEvent({
    kind: EventKind.TEXT_NOTE,
    content: 'hello world',
  });
  const REGULAR_EVENT_DOCUMENT = {
    id: regularEvent.id,
    pubkey: regularEvent.pubkey,
    createdAt: regularEvent.created_at,
    kind: regularEvent.kind,
    tags: regularEvent.tags,
    genericTags: [],
    content: regularEvent.content,
    sig: regularEvent.sig,
    author: regularEvent.pubkey,
    dTagValue: null,
    expiredAt: null,
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
      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });

    it('should update index settings if has index', () => {
      eventSearchRepositoryWithIndex.onApplicationBootstrap();
      expect(mockUpdateSettings).toHaveBeenCalledWith({
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
      expect(mockSearch).toHaveBeenCalledWith('search', {
        filter: `(expiredAt IS NULL OR expiredAt >= 1620000000)`,
        sort: ['createdAt:desc'],
        limit: 100,
      });
      expect(events).toEqual([regularEvent]);
    });

    it('has ids filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        ids: ['id1', 'id2'],
      });
      expect(mockSearch).toHaveBeenCalledWith('', {
        filter: `(expiredAt IS NULL OR expiredAt >= 1620000000) AND id IN ["id1", "id2"]`,
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has kinds filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        kinds: [1, 2],
      });
      expect(mockSearch).toHaveBeenCalledWith('', {
        filter: `(expiredAt IS NULL OR expiredAt >= 1620000000) AND kind IN [1, 2]`,
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has since filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        since: 1620000000,
      });
      expect(mockSearch).toHaveBeenCalledWith('', {
        filter: `(expiredAt IS NULL OR expiredAt >= 1620000000) AND createdAt >= 1620000000`,
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has until filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        until: 1620000000,
      });
      expect(mockSearch).toHaveBeenCalledWith('', {
        filter: `(expiredAt IS NULL OR expiredAt >= 1620000000) AND createdAt <= 1620000000`,
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has authors filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        authors: ['pubkey1', 'pubkey2'],
      });
      expect(mockSearch).toHaveBeenCalledWith('', {
        filter: `(expiredAt IS NULL OR expiredAt >= 1620000000) AND author IN ["pubkey1", "pubkey2"]`,
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has genericTagsCollection filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        '#a': ['genericTags'],
        '#b': ['genericTags'],
      });
      expect(mockSearch).toHaveBeenCalledWith('', {
        filter: `(expiredAt IS NULL OR expiredAt >= 1620000000) AND genericTags IN ["a:genericTags"] AND genericTags IN ["b:genericTags"]`,
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has dTagValues filter', async () => {
      await eventSearchRepositoryWithIndex.find({
        search: '',
        '#d': ['dTagValue1', 'dTagValue2'],
      });
      expect(mockSearch).toHaveBeenCalledWith('', {
        filter: `(expiredAt IS NULL OR expiredAt >= 1620000000) AND dTagValue IN ["dTagValue1", "dTagValue2"]`,
        sort: ['createdAt:desc'],
        limit: 100,
      });
    });

    it('has limit', async () => {
      await eventSearchRepositoryWithIndex.find({ search: '', limit: 10 });
      expect(mockSearch).toHaveBeenCalledWith('', {
        filter: `(expiredAt IS NULL OR expiredAt >= 1620000000)`,
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
        '#a': ['genericTags'],
        '#b': ['genericTags'],
        '#d': ['dTagValue1', 'dTagValue2'],
        limit: 10,
      });
      expect(mockSearch).toHaveBeenCalledWith('search', {
        filter: `(expiredAt IS NULL OR expiredAt >= 1620000000) AND id IN ["id1", "id2"] AND kind IN [1, 2] AND createdAt >= 1620000000 AND createdAt <= 1630000000 AND author IN ["pubkey1", "pubkey2"] AND genericTags IN ["a:genericTags"] AND genericTags IN ["b:genericTags"] AND dTagValue IN ["dTagValue1", "dTagValue2"]`,
        sort: ['createdAt:desc'],
        limit: 10,
      });
    });
  });

  describe('findTopIds', () => {
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
      await eventSearchRepositoryWithoutIndex.add(regularEvent, {} as any);
      expect(mockAddDocuments).not.toHaveBeenCalled();
    });

    it('should add documents if has index', async () => {
      await eventSearchRepositoryWithIndex.add(regularEvent, {
        author: regularEvent.pubkey,
        genericTags: [],
        dTagValue: null,
        expiredAt: null,
      });
      expect(mockAddDocuments).toHaveBeenCalledWith([REGULAR_EVENT_DOCUMENT]);
    });

    it('should throw error if addDocuments failed', async () => {
      const addDocumentsFailError = new Error('addDocuments fail');
      jest
        .spyOn(eventSearchRepositoryWithIndex['index'] as any, 'addDocuments')
        .mockRejectedValue(addDocumentsFailError);
      await eventSearchRepositoryWithIndex.add(regularEvent, {} as any);
      expect(logError).toHaveBeenCalledWith(addDocumentsFailError);
    });
  });

  describe('deleteReplaceableEvents', () => {
    it('should not delete documents if no index', async () => {
      await eventSearchRepositoryWithoutIndex.deleteReplaceableEvents(
        '',
        0,
        '',
      );
      expect(mockDeleteDocuments).not.toHaveBeenCalled();
    });

    it('should delete documents if has index', async () => {
      await eventSearchRepositoryWithIndex.deleteReplaceableEvents(
        'author',
        0,
        'dTagValue',
      );
      expect(mockDeleteDocuments).toHaveBeenCalledWith({
        filter: `author = "author" AND kind = 0 AND dTagValue = "dTagValue"`,
      });
    });

    it('should throw error if deleteDocuments failed', async () => {
      const deleteDocumentsFailError = new Error('deleteDocuments fail');
      mockDeleteDocuments.mockRejectedValue(deleteDocumentsFailError);
      await eventSearchRepositoryWithIndex.deleteReplaceableEvents('', 0, '');
      expect(logError).toHaveBeenCalledWith(deleteDocumentsFailError);
    });
  });
});
