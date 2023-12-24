import { createMock } from '@golevelup/ts-jest';
import { EventService } from './event.service';
import { EventRepository } from '../repositories';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config';
import { Filter } from '@nostr-relay/common';

describe('EventService', () => {
  describe('findTopIds', () => {
    it('should return the top 1000 ids with cache', async () => {
      const eventService = new EventService(
        createMock<EventRepository>(),
        createMock<ConfigService<Config, true>>({
          get: jest.fn().mockReturnValue({ filterResultCacheTtl: 20 }),
        }),
      );

      const filters: Filter[] = [{}, {}, {}, {}, {}];
      const findTopIdsSpy = jest
        .spyOn(eventService['eventRepository'], 'findTopIds')
        .mockResolvedValue([{ id: 'testId', score: 1 }]);

      const result = await eventService.findTopIds(filters);

      expect(findTopIdsSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(['testId']);
    });

    it('should return the top 1000 ids without cache', async () => {
      const eventService = new EventService(
        createMock<EventRepository>(),
        createMock<ConfigService<Config, true>>({
          get: jest.fn().mockReturnValue({ filterResultCacheTtl: 0 }),
        }),
      );

      const filters: Filter[] = [{}, {}, {}, {}, {}];
      const findTopIdsSpy = jest
        .spyOn(eventService['eventRepository'], 'findTopIds')
        .mockResolvedValue([{ id: 'testId', score: 1 }]);

      const result = await eventService.findTopIds(filters);

      expect(findTopIdsSpy).toHaveBeenCalledTimes(filters.length);
      expect(result).toEqual(['testId']);
    });
  });
});
