import { createMock } from '@golevelup/ts-jest';
import { INestApplication, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Event, Filter } from '@nostr-relay/common';
import * as request from 'supertest';
import { NostrRelayService } from '../services/nostr-relay.service';
import { EventController } from './event.controller';

describe('EventController', () => {
  let app: INestApplication;
  let nostrRelayService: NostrRelayService;

  beforeEach(async () => {
    nostrRelayService = createMock<NostrRelayService>();
    const moduleRef = await Test.createTestingModule({
      imports: [NostrModule],
    })
      .overrideProvider(NostrRelayService)
      .useValue(nostrRelayService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/POST events', () => {
    it('success', () => {
      jest
        .spyOn(nostrRelayService, 'validateEvent')
        .mockImplementation(async (data) => data as Event);
      jest.spyOn(nostrRelayService, 'handleEvent').mockResolvedValue({
        success: true,
      });

      return request(app.getHttpServer())
        .post('/api/v1/events')
        .send({ id: 'test' })
        .expect(201);
    });

    it('invalid event', () => {
      jest
        .spyOn(nostrRelayService, 'validateEvent')
        .mockRejectedValue(new Error('Invalid event'));

      return request(app.getHttpServer())
        .post('/api/v1/events')
        .send({ id: 'test' })
        .expect(400, {
          message: 'Invalid event',
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('invalid event (when handleEvent fails)', () => {
      jest
        .spyOn(nostrRelayService, 'validateEvent')
        .mockImplementation(async (data) => data as Event);
      jest.spyOn(nostrRelayService, 'handleEvent').mockResolvedValue({
        success: false,
        message: 'message',
      });

      return request(app.getHttpServer())
        .post('/api/v1/events')
        .send({ id: 'test' })
        .expect(400, {
          message: 'message',
          error: 'Bad Request',
          statusCode: 400,
        });
    });
  });

  describe('/GET events/:id', () => {
    it('success', () => {
      const id =
        '0d1d776e94d27809735134b1605f3cef6dedcc5bf0bdf03991b07f9488804a6b';
      jest
        .spyOn(nostrRelayService, 'findEvents')
        .mockResolvedValue([{ id } as Event]);

      return request(app.getHttpServer())
        .get('/api/v1/events/' + id)
        .expect(200, { data: { id } });
    });

    it('invalid event ID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/events/invalid')
        .expect(400, {
          message: 'Invalid event ID',
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('event not found', () => {
      const id =
        '0d1d776e94d27809735134b1605f3cef6dedcc5bf0bdf03991b07f9488804a6b';
      jest.spyOn(nostrRelayService, 'findEvents').mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/api/v1/events/' + id)
        .expect(404, {
          message: 'Event not found',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('event not found (when findEvents fails)', () => {
      const id =
        '0d1d776e94d27809735134b1605f3cef6dedcc5bf0bdf03991b07f9488804a6b';
      jest
        .spyOn(nostrRelayService, 'findEvents')
        .mockRejectedValue(new Error());

      return request(app.getHttpServer())
        .get('/api/v1/events/' + id)
        .expect(404, {
          message: 'Event not found',
          error: 'Not Found',
          statusCode: 404,
        });
    });
  });

  describe('/GET events', () => {
    it('success', () => {
      jest
        .spyOn(nostrRelayService, 'validateFilter')
        .mockImplementation(async (data) => data as Filter);
      jest
        .spyOn(nostrRelayService, 'findEvents')
        .mockResolvedValue([{ id: 'test' } as Event]);

      return request(app.getHttpServer())
        .get('/api/v1/events')
        .query({ ids: ['test'] })
        .expect(200, { data: [{ id: 'test' }] });
    });

    it('invalid filters', () => {
      jest
        .spyOn(nostrRelayService, 'validateFilter')
        .mockRejectedValue(new Error('Invalid filters'));

      return request(app.getHttpServer())
        .get('/api/v1/events')
        .query({ ids: ['test'] })
        .expect(400, {
          message: 'Invalid filters',
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('return empty array when findEvents fails', () => {
      jest
        .spyOn(nostrRelayService, 'validateFilter')
        .mockImplementation(async (data) => data as Filter);
      jest
        .spyOn(nostrRelayService, 'findEvents')
        .mockRejectedValue(new Error());

      return request(app.getHttpServer())
        .get('/api/v1/events')
        .query({ ids: ['test'] })
        .expect(200, { data: [] });
    });

    it('preprocessFindEventsDto', async () => {
      jest
        .spyOn(nostrRelayService, 'validateFilter')
        .mockImplementation(async (data) => data as Filter);
      const fakeFindEvents = jest
        .spyOn(nostrRelayService, 'findEvents')
        .mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/events?ids=test')
        .expect(200);
      expect(fakeFindEvents).toHaveBeenLastCalledWith(
        [{ ids: ['test'] }],
        undefined,
      );

      await request(app.getHttpServer())
        .get('/api/v1/events?ids=test1,test2')
        .expect(200);
      expect(fakeFindEvents).toHaveBeenLastCalledWith(
        [{ ids: ['test1', 'test2'] }],
        undefined,
      );

      await request(app.getHttpServer())
        .get('/api/v1/events?ids[]=test')
        .expect(200);
      expect(fakeFindEvents).toHaveBeenLastCalledWith(
        [{ ids: ['test'] }],
        undefined,
      );

      await request(app.getHttpServer())
        .get('/api/v1/events?ids[]=test1&ids[]=test2')
        .expect(200);
      expect(fakeFindEvents).toHaveBeenLastCalledWith(
        [{ ids: ['test1', 'test2'] }],
        undefined,
      );

      await request(app.getHttpServer()).get('/api/v1/events?ids=').expect(200);
      expect(fakeFindEvents).toHaveBeenLastCalledWith([{}], undefined);

      await request(app.getHttpServer())
        .get('/api/v1/events?kinds=1')
        .expect(200);
      expect(fakeFindEvents).toHaveBeenLastCalledWith(
        [{ kinds: [1] }],
        undefined,
      );

      await request(app.getHttpServer())
        .get('/api/v1/events?kinds=1,2')
        .expect(200);
      expect(fakeFindEvents).toHaveBeenLastCalledWith(
        [{ kinds: [1, 2] }],
        undefined,
      );

      await request(app.getHttpServer())
        .get('/api/v1/events?limit=10')
        .expect(200);
      expect(fakeFindEvents).toHaveBeenLastCalledWith(
        [{ limit: 10 }],
        undefined,
      );

      await request(app.getHttpServer())
        .get('/api/v1/events?d=test')
        .expect(200);
      expect(fakeFindEvents).toHaveBeenLastCalledWith(
        [{ '#d': ['test'] }],
        undefined,
      );

      await request(app.getHttpServer())
        .get('/api/v1/events?d=test1,test2')
        .expect(200);
      expect(fakeFindEvents).toHaveBeenLastCalledWith(
        [{ '#d': ['test1', 'test2'] }],
        undefined,
      );
    });
  });

  describe('/POST events/request', () => {
    it('success', () => {
      jest
        .spyOn(nostrRelayService, 'validateFilters')
        .mockImplementation(async (data) => data as Filter[]);
      jest
        .spyOn(nostrRelayService, 'findEvents')
        .mockResolvedValue([{ id: 'test' } as Event]);

      return request(app.getHttpServer())
        .post('/api/v1/events/request')
        .send()
        .expect(201, { data: [{ id: 'test' }] });
    });

    it('invalid filters', () => {
      jest
        .spyOn(nostrRelayService, 'validateFilters')
        .mockRejectedValue(new Error('Invalid filters'));

      return request(app.getHttpServer())
        .post('/api/v1/events/request')
        .send({ filters: [{ ids: ['test'] }] })
        .expect(400, {
          message: 'Invalid filters',
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('return empty array when findEvents fails', () => {
      jest
        .spyOn(nostrRelayService, 'validateFilters')
        .mockImplementation(async (data) => data as Filter[]);
      jest
        .spyOn(nostrRelayService, 'findEvents')
        .mockRejectedValue(new Error());

      return request(app.getHttpServer())
        .post('/api/v1/events/request')
        .send()
        .expect(201, { data: [] });
    });
  });
});

@Module({
  controllers: [EventController],
  providers: [
    NostrRelayService,
    {
      provide: ConfigService,
      useValue: createMock<ConfigService>({
        get: jest.fn(),
      }),
    },
  ],
})
export class NostrModule {}
