import { MetricService } from './metric.service';

describe('metricService', () => {
  let metricService: MetricService;

  beforeEach(() => {
    metricService = new MetricService();
  });

  it('should increment connection count', () => {
    metricService.incrementConnectionCount();
    expect(metricService['connectionCount']).toBe(1);
    expect(metricService['currentConnectionCount']).toBe(1);
    expect(metricService['maxConcurrentConnectionCount']).toBe(1);
  });

  it('should decrement connection count', () => {
    metricService.incrementConnectionCount();
    metricService.decrementConnectionCount();
    expect(metricService['connectionCount']).toBe(1);
    expect(metricService['currentConnectionCount']).toBe(0);
    expect(metricService['maxConcurrentConnectionCount']).toBe(1);
  });

  it('should push REQ processing time', () => {
    const mockReqDigestPush = jest
      .spyOn(metricService['reqDigest'], 'push')
      .mockImplementation();
    metricService.pushProcessingTime('REQ', 100);
    expect(mockReqDigestPush).toHaveBeenCalledWith(100);
  });

  it('should push EVENT processing time', () => {
    const mockEventDigestPush = jest
      .spyOn(metricService['eventDigest'], 'push')
      .mockImplementation();
    metricService.pushProcessingTime('EVENT', 100);
    expect(mockEventDigestPush).toHaveBeenCalledWith(100);
  });

  it('should push CLOSE processing time', () => {
    const mockCloseDigestPush = jest
      .spyOn(metricService['closeDigest'], 'push')
      .mockImplementation();
    metricService.pushProcessingTime('CLOSE', 100);
    expect(mockCloseDigestPush).toHaveBeenCalledWith(100);
  });

  it('should push AUTH processing time', () => {
    const mockAuthDigestPush = jest
      .spyOn(metricService['authDigest'], 'push')
      .mockImplementation();
    metricService.pushProcessingTime('AUTH', 100);
    expect(mockAuthDigestPush).toHaveBeenCalledWith(100);
  });

  it('should record metric', () => {
    metricService.incrementConnectionCount();

    const mockMetricsPush = jest
      .spyOn(metricService['metrics'], 'push')
      .mockImplementation();
    const mockReqDigestReset = jest
      .spyOn(metricService['reqDigest'], 'reset')
      .mockImplementation();
    const mockEventDigestReset = jest
      .spyOn(metricService['eventDigest'], 'reset')
      .mockImplementation();
    const mockAuthDigestReset = jest
      .spyOn(metricService['authDigest'], 'reset')
      .mockImplementation();
    const mockCloseDigestReset = jest
      .spyOn(metricService['closeDigest'], 'reset')
      .mockImplementation();

    metricService.recordMetric();

    expect(mockMetricsPush).toHaveBeenCalled();
    expect(metricService['maxConcurrentConnectionCount']).toBe(0);
    expect(metricService['connectionCount']).toBe(0);
    expect(metricService['currentConnectionCount']).toBe(1);
    expect(mockReqDigestReset).toHaveBeenCalled();
    expect(mockEventDigestReset).toHaveBeenCalled();
    expect(mockAuthDigestReset).toHaveBeenCalled();
    expect(mockCloseDigestReset).toHaveBeenCalled();
  });

  it('should keep the length of metrics less than or equal to 24', () => {
    for (let i = 0; i < 30; i++) {
      metricService.recordMetric();
    }
    expect(metricService['metrics'].length).toBe(24);
  });

  it('should get metrics', () => {
    const metrics = metricService.getMetrics();
    expect(metrics.startupTime).toBeDefined();
    expect(metrics.metrics).toBeDefined();
  });
});
