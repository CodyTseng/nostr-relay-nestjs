import { MetricService } from './metric.service';

describe('metricService', () => {
  let metricService: MetricService;

  beforeEach(() => {
    metricService = new MetricService();
  });

  it('should increment connection count', () => {
    metricService.incrementConnectionCount();
    expect(metricService.getMetrics().connectionCount).toBe(1);
  });

  it('should decrement connection count', () => {
    metricService.decrementConnectionCount();
    expect(metricService.getMetrics().connectionCount).toBe(-1);
  });

  it('should push REQ processing time', () => {
    for (let i = 0; i < 1000; i++) {
      metricService.pushProcessingTime('REQ', Math.floor(Math.random() * 1000));
    }
    const metrics = metricService.getMetrics();
    expect(metrics.reqRequestCount).toBe(1000);
    expect(metrics.reqProcessingTime[0]).toBeCloseTo(500, -2);
    expect(metrics.reqProcessingTime[1]).toBeCloseTo(950, -2);
    expect(metrics.reqProcessingTime[2]).toBeCloseTo(990, -2);
  });

  it('should push EVENT processing time', () => {
    for (let i = 0; i < 1000; i++) {
      metricService.pushProcessingTime(
        'EVENT',
        Math.floor(Math.random() * 1000),
      );
    }
    const metrics = metricService.getMetrics();
    expect(metrics.eventRequestCount).toBe(1000);
    expect(metrics.eventProcessingTime[0]).toBeCloseTo(500, -2);
    expect(metrics.eventProcessingTime[1]).toBeCloseTo(950, -2);
    expect(metrics.eventProcessingTime[2]).toBeCloseTo(990, -2);
  });

  it('should push CLOSE processing time', () => {
    for (let i = 0; i < 1000; i++) {
      metricService.pushProcessingTime(
        'CLOSE',
        Math.floor(Math.random() * 1000),
      );
    }
    const metrics = metricService.getMetrics();
    expect(metrics.closeRequestCount).toBe(1000);
    expect(metrics.closeProcessingTime[0]).toBeCloseTo(500, -2);
    expect(metrics.closeProcessingTime[1]).toBeCloseTo(950, -2);
    expect(metrics.closeProcessingTime[2]).toBeCloseTo(990, -2);
  });

  it('should push AUTH processing time', () => {
    for (let i = 0; i < 1000; i++) {
      metricService.pushProcessingTime(
        'AUTH',
        Math.floor(Math.random() * 1000),
      );
    }
    const metrics = metricService.getMetrics();
    expect(metrics.authRequestCount).toBe(1000);
    expect(metrics.authProcessingTime[0]).toBeCloseTo(500, -2);
    expect(metrics.authProcessingTime[1]).toBeCloseTo(950, -2);
    expect(metrics.authProcessingTime[2]).toBeCloseTo(990, -2);
  });
});
