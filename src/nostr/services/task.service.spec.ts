import { createMock } from '@golevelup/ts-jest';
import { PinoLogger } from 'nestjs-pino';
import { EventRepository } from '../repositories';
import { TaskService } from './task.service';

describe('TaskService', () => {
  it('should call eventRepository.deleteExpiredEvents', async () => {
    const mockLogger = createMock<PinoLogger>({
      info: jest.fn(),
    });
    const mockEventRepository = createMock<EventRepository>({
      deleteExpiredEvents: jest.fn().mockResolvedValue({ affected: 1 }),
    });
    const taskService = new TaskService(mockLogger, mockEventRepository);
    await taskService.deleteExpiredEvents();
    expect(mockEventRepository.deleteExpiredEvents).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('Deleted 1 expired events');
  });
});
