import { Injectable } from '@nestjs/common';
import { MessageType } from '@nostr-relay/common';
import { Digest } from 'tdigest';

@Injectable()
export class MetricService {
  private readonly startupTime = new Date().toUTCString();
  private connectionCount = 0;
  private connectionCountDigest = new Digest();
  private reqDigest = new Digest();
  private eventDigest = new Digest();
  private closeDigest = new Digest();
  private authDigest = new Digest();
  private metrics: {
    timestamp: number;
    connectionCount: number;
    reqProcessingTimes: number[];
    eventProcessingTimes: number[];
    authProcessingTimes: number[];
    closeProcessingTimes: number[];
  }[] = [];

  incrementConnectionCount() {
    this.connectionCount++;
    this.connectionCountDigest.push(this.connectionCount);
  }

  decrementConnectionCount() {
    this.connectionCount--;
    this.connectionCountDigest.push(this.connectionCount);
  }

  pushProcessingTime(msgType: MessageType, time: number) {
    switch (msgType) {
      case MessageType.REQ:
        this.reqDigest.push(time);
        break;
      case MessageType.EVENT:
        this.eventDigest.push(time);
        break;
      case MessageType.CLOSE:
        this.closeDigest.push(time);
        break;
      case MessageType.AUTH:
        this.authDigest.push(time);
        break;
    }
  }

  recordMetric() {
    this.metrics.push({
      timestamp: Date.now(),
      connectionCount: this.connectionCountDigest.percentile(0.5) ?? 0,
      reqProcessingTimes: this.reqDigest
        .percentile([0.5, 0.75, 0.9, 0.95, 0.99])
        .map((n) => n ?? 0),
      eventProcessingTimes: this.eventDigest
        .percentile([0.5, 0.75, 0.9, 0.95, 0.99])
        .map((n) => n ?? 0),
      authProcessingTimes: this.authDigest
        .percentile([0.5, 0.75, 0.9, 0.95, 0.99])
        .map((n) => n ?? 0),
      closeProcessingTimes: this.closeDigest
        .percentile([0.5, 0.75, 0.9, 0.95, 0.99])
        .map((n) => n ?? 0),
    });
    this.connectionCountDigest.reset();
    this.reqDigest.reset();
    this.eventDigest.reset();
    this.authDigest.reset();
    this.closeDigest.reset();
    if (this.metrics.length > 24) {
      this.metrics.shift();
    }
  }

  getMetrics() {
    return {
      startupTime: this.startupTime,
      metrics: this.metrics,
    };
  }
}
