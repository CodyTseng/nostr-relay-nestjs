import { createMock } from '@golevelup/ts-jest';
import { PinoLogger } from 'nestjs-pino';
import { MetricService } from '../metric/metric.service';
import { EventRepository } from '../repositories/event.repository';
import { WotService } from '../wot/wot.service';
import { TaskService } from './task.service';

describe('TaskService', () => {
  it('should call eventRepository.deleteExpiredEvents', async () => {
    const mockLogger = createMock<PinoLogger>({
      info: jest.fn(),
    });
    const mockEventRepository = createMock<EventRepository>({
      deleteExpiredEvents: jest.fn().mockResolvedValue(1),
    });
    const taskService = new TaskService(
      mockLogger,
      mockEventRepository,
      createMock<MetricService>(),
      createMock<WotService>(),
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
      createMock<WotService>(),
    );
    await taskService.recordMetric();
    expect(mockMetricService.recordMetric).toHaveBeenCalled();
  });

  it('should call wotService.refreshWot', async () => {
    const mockLogger = createMock<PinoLogger>();
    const mockWotService = createMock<WotService>({
      refreshWot: jest.fn(),
    });
    const taskService = new TaskService(
      mockLogger,
      createMock<EventRepository>(),
      createMock<MetricService>(),
      mockWotService,
    );
    await taskService.refreshWot();
    expect(mockWotService.refreshWot).toHaveBeenCalled();
  });
});
