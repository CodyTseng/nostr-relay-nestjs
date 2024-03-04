import { createMock } from '@golevelup/ts-jest';
import { PinoLogger } from 'nestjs-pino';
import { EventRepository } from '../repositories';
import { MetricService } from './metric.service';
import { TaskService } from './task.service';

describe('TaskService', () => {
  it('should call eventRepository.deleteExpiredEvents', async () => {
    const mockLogger = createMock<PinoLogger>({
      info: jest.fn(),
    });
    const mockEventRepository = createMock<EventRepository>({
      deleteExpiredEvents: jest.fn().mockResolvedValue({ affected: 1 }),
    });
    const taskService = new TaskService(
      mockLogger,
      mockEventRepository,
      createMock<MetricService>(),
    );
    await taskService.deleteExpiredEvents();
    expect(mockEventRepository.deleteExpiredEvents).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('Deleted 1 expired events');
  });

  it('should call metricService.recordMetric', async () => {
    const mockLogger = createMock<PinoLogger>();
    const mockMetricService = createMock<MetricService>({
      recordMetric: jest.fn(),
    });
    const taskService = new TaskService(
      mockLogger,
      createMock<EventRepository>(),
      mockMetricService,
    );
    await taskService.recordMetric();
    expect(mockMetricService.recordMetric).toHaveBeenCalled();
  });
});
