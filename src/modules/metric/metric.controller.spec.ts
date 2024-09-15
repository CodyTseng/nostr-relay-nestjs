import { createMock } from '@golevelup/ts-jest';
import { MetricController } from './metric.controller';
import { MetricService } from './metric.service';

describe('MetricController', () => {
  it('should return metrics', () => {
    const nostrController = new MetricController(
      createMock<MetricService>({
        getMetrics: jest.fn().mockReturnValue({ test: 'test' }),
      }),
    );

    expect(nostrController.metrics()).toEqual({ test: 'test' });
  });
});
