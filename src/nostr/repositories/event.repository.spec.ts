import { sortBy } from 'lodash';
import { newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import {
  createEventDtoMock,
  EXPIRED_EVENT,
  PARAMETERIZED_REPLACEABLE_EVENT,
  REGULAR_EVENT,
  REGULAR_EVENT_DTO,
  REPLACEABLE_EVENT,
  REPLACEABLE_EVENT_NEW,
} from '../../../seeds';
import { Event, Filter } from '../entities';
import { EventRepository } from '../repositories';

describe('EventRepository', () => {
  let eventRepository: EventRepository;

  beforeEach(async () => {
    const db = newDb();
    db.public.registerFunction({
      implementation: () => 'test',
      name: 'current_database',
    });
    db.public.registerFunction({
      implementation: () => 'test',
      name: 'version',
    });
    const ds: DataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [Event],
    });
    await ds.initialize();
    await ds.synchronize();
    const repository = ds.getRepository(Event);
    eventRepository = new EventRepository(repository);
  });

  describe('create', () => {
    it('should create successfully', async () => {
      expect(await eventRepository.create(REGULAR_EVENT)).toBeTruthy();

      expect(
        (
          await eventRepository.findOne({ ids: [REGULAR_EVENT.id] })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());
    });

    it('should return false when the event already exists', async () => {
      expect(
        await eventRepository.create(PARAMETERIZED_REPLACEABLE_EVENT),
      ).toBeTruthy();
      expect(
        await eventRepository.create(PARAMETERIZED_REPLACEABLE_EVENT),
      ).toBeFalsy();
    });

    it('should throw error', async () => {
      await expect(
        eventRepository.create(
          Event.fromEventDto({ ...REGULAR_EVENT_DTO, id: undefined } as any),
        ),
      ).rejects.toThrowError();
    });
  });

  describe('find & findOne', () => {
    beforeEach(async () => {
      await Promise.all([
        eventRepository.create(REGULAR_EVENT),
        eventRepository.create(REPLACEABLE_EVENT),
        eventRepository.create(PARAMETERIZED_REPLACEABLE_EVENT),
        eventRepository.create(EXPIRED_EVENT),
      ]);
    });

    it('should filter by id successfully', async () => {
      expect(
        (
          await eventRepository.find({
            ids: [REGULAR_EVENT.id, REPLACEABLE_EVENT.id],
          })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.find({
            ids: [
              REGULAR_EVENT.id.slice(0, 10),
              REPLACEABLE_EVENT.id.slice(0, 13),
            ],
          })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.find({
            ids: [REGULAR_EVENT.id.slice(0, 10), REPLACEABLE_EVENT.id],
          })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.findOne({ ids: [REGULAR_EVENT.id] })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());

      expect(
        (
          await eventRepository.findOne({
            ids: [REGULAR_EVENT.id.slice(0, 10)],
          })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());

      expect(await eventRepository.find([])).toEqual([]);
    });

    it('should filter by kind successfully', async () => {
      expect(
        (
          await eventRepository.find({
            kinds: [REGULAR_EVENT.kind, REPLACEABLE_EVENT.kind],
          })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.findOne({ kinds: [REGULAR_EVENT.kind] })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());
    });

    it('should filter by authors successfully', async () => {
      expect(
        (await eventRepository.find({ authors: [REGULAR_EVENT.pubkey] })).map(
          (event) => event.toEventDto(),
        ),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.find({
            authors: [REGULAR_EVENT.pubkey.slice(0, 10)],
          })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.findOne({ authors: [REGULAR_EVENT.pubkey] })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());

      expect(
        (
          await eventRepository.findOne({
            authors: [REGULAR_EVENT.pubkey.slice(0, 10)],
          })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());
    });

    it('should filter by created_at successfully', async () => {
      expect(
        (
          await eventRepository.find({ since: REPLACEABLE_EVENT.createdAt })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.find({ until: REPLACEABLE_EVENT.createdAt })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REPLACEABLE_EVENT, PARAMETERIZED_REPLACEABLE_EVENT].map((event) =>
          event.toEventDto(),
        ),
      );

      expect(
        (
          await eventRepository.find({
            since: REPLACEABLE_EVENT.createdAt,
            until: REPLACEABLE_EVENT.createdAt,
          })
        ).map((event) => event.toEventDto()),
      ).toEqual([REPLACEABLE_EVENT].map((event) => event.toEventDto()));

      expect(
        (
          await eventRepository.findOne({ until: REGULAR_EVENT.createdAt })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());

      expect(
        (
          await eventRepository.findOne({ since: REPLACEABLE_EVENT.createdAt })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());
    });

    it('should filter by dTagValue successfully', async () => {
      expect(
        (await eventRepository.find({ dTagValues: ['test'] })).map((event) =>
          event.toEventDto(),
        ),
      ).toEqual(
        [PARAMETERIZED_REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (await eventRepository.findOne({ dTagValues: ['test'] }))?.toEventDto(),
      ).toEqual(PARAMETERIZED_REPLACEABLE_EVENT.toEventDto());
    });

    it('should filter by tag successfully', async () => {
      expect(
        (
          await eventRepository.find(
            Filter.fromFilterDto({
              tags: {
                p: [
                  '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
                  'f91f27cd352303d0357a3f5d78e641b4a676677a59aa9e790ee16879d8efe55c',
                  '1b8649bbf0fe2fa92afba2b503ff30bf0bef0663ea6a44e4a1e928613fe2cd0d',
                  '40f416a62a5b1204607a0222fb07069b1ad09eca2b93332a36eb8f640731ce35',
                  '3ef71057e98c547abe0b3044243e87dafdcef9fa6fdf486478274cf59349117c',
                  'd6feb6bfe391a135820baffd98298f272b5931a9e546063a87ec6243a1c8e2f1',
                  '1d3eaf75cd751f4935be2bb28130de6e58ea2d4473bce88e17310aded0479f1e',
                  '149ce8eb73ad67d98fbefc36b55decdbf1ef44b7d0c5524dbae87ebd7c3005e8',
                  '91404933c3b018437c3c2aa129aecef2f1c463a6d033ba37d0df6f6a7884f121',
                  '7488a719b99cbf7d3164ff6b44a8984bb70f3902c05f4b1a34e9bf5f4ea69734',
                  '840a7a267b4cba889dab5935b438f705f69a1059baf50a96b8b50517f96b130d',
                  '8392a2a43aa1e79546f24e9c4ef2c9a3b31098bf829b5f0c16b98de5e09d666c',
                  '0478a9255ec460c6603b276fbe563d3d36c44f4736ebc83a047569dac7163e7b',
                  '33420b22c018012a8d24999e2259a9ee3749c63b901eb2487c22ce827547252e',
                  '031f6884be10658192945549253af43e32ee862b98f96841c082dbf0ff2ae037',
                  '4fa55a1eceb362fa46e7c43affe5635e3f13ccfc147c1e184a6f122514c4b558',
                ],
              },
            }),
          )
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [PARAMETERIZED_REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.findOne(
            Filter.fromFilterDto({
              tags: {
                p: [
                  '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
                ],
              },
            }),
          )
        )?.toEventDto(),
      ).toEqual(PARAMETERIZED_REPLACEABLE_EVENT.toEventDto());

      const unStandardTagEventDto = createEventDtoMock({
        tags: [['z', 'test2']],
      });
      await eventRepository.create(Event.fromEventDto(unStandardTagEventDto));
      expect(
        (
          await eventRepository.findOne(
            Filter.fromFilterDto({ tags: { z: ['test1', 'test2'] } }),
          )
        )?.toEventDto(),
      ).toEqual(unStandardTagEventDto);
    });

    it('should find by multi filters successfully', async () => {
      expect(
        (
          await eventRepository.find([
            { ids: [REGULAR_EVENT.id] },
            { kinds: [REPLACEABLE_EVENT.kind] },
          ])
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.findOne([
            { ids: [REGULAR_EVENT.id] },
            { kinds: [REPLACEABLE_EVENT.kind] },
          ])
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());
    });

    it('should limit successfully', async () => {
      expect(
        await eventRepository.find({
          authors: [REGULAR_EVENT.pubkey],
          limit: 1,
        }),
      ).toHaveLength(1);
    });
  });

  describe('replace', () => {
    it('should replace successfully', async () => {
      expect(await eventRepository.replace(REPLACEABLE_EVENT)).toBeTruthy();
      expect(
        (
          await eventRepository.findOne({
            ids: [REPLACEABLE_EVENT.id],
          })
        )?.toEventDto(),
      ).toEqual(REPLACEABLE_EVENT.toEventDto());

      expect(
        await eventRepository.replace(
          REPLACEABLE_EVENT_NEW,
          REPLACEABLE_EVENT.id,
        ),
      ).toBeTruthy();
      expect(
        (
          await eventRepository.findOne({
            ids: [REPLACEABLE_EVENT_NEW.id],
          })
        )?.toEventDto(),
      ).toEqual(REPLACEABLE_EVENT_NEW.toEventDto());
      expect(
        await eventRepository.findOne({ ids: [REPLACEABLE_EVENT.id] }),
      ).toBeNull();
    });

    it('should return false when the id of the old and new events are the same', async () => {
      expect(
        await eventRepository.replace(REPLACEABLE_EVENT, REPLACEABLE_EVENT.id),
      ).toBeFalsy();
    });
  });

  describe('delete', () => {
    it('should delete successfully', async () => {
      await eventRepository.create(REGULAR_EVENT);
      await eventRepository.create(REPLACEABLE_EVENT);

      expect(
        (
          await eventRepository.find({
            ids: [REGULAR_EVENT.id, REPLACEABLE_EVENT.id],
          })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        await eventRepository.delete([REGULAR_EVENT.id, REPLACEABLE_EVENT.id]),
      ).toBe(2);
      expect(
        await eventRepository.find({
          ids: [REGULAR_EVENT.id, REPLACEABLE_EVENT.id],
        }),
      ).toEqual([]);
    });
  });

  describe('count', () => {
    it('should count successfully', async () => {
      const EVENTS = [
        REGULAR_EVENT,
        REPLACEABLE_EVENT,
        PARAMETERIZED_REPLACEABLE_EVENT,
      ];
      await Promise.all(EVENTS.map((EVENT) => eventRepository.create(EVENT)));

      expect(await eventRepository.count([{}])).toBe(EVENTS.length);
    });
  });

  describe('findTopIdsWithScore', () => {
    it('should find top ids with score successfully', async () => {
      const EVENTS = [
        REGULAR_EVENT,
        REPLACEABLE_EVENT,
        PARAMETERIZED_REPLACEABLE_EVENT,
      ];
      await Promise.all(EVENTS.map((EVENT) => eventRepository.create(EVENT)));

      expect(await eventRepository.findTopIdsWithScore([{}])).toEqual(
        sortBy(
          EVENTS.map((e) => ({ id: e.id, score: e.createdAt })),
          (item) => -item.score,
        ),
      );
    });
  });
});
