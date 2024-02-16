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

  it('should get metrics', () => {
    const metrics = metricService.getMetrics();
    expect(metrics.startupTime).toBeDefined();
    expect(metrics.connectionCount).toBeDefined();
    expect(metrics.reqProcessingTime).toBeDefined();
    expect(metrics.eventProcessingTime).toBeDefined();
    expect(metrics.closeProcessingTime).toBeDefined();
    expect(metrics.authProcessingTime).toBeDefined();
  });
});
