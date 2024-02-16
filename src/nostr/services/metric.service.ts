import { Injectable } from '@nestjs/common';
import { MessageType } from '@nostr-relay/common';
import { Digest } from 'tdigest';

@Injectable()
export class MetricService {
  private readonly startupTime = new Date().toUTCString();
  private connectionCount = 0;
  private reqDigest = new Digest();
  private eventDigest = new Digest();
  private closeDigest = new Digest();
  private authDigest = new Digest();

  incrementConnectionCount() {
    this.connectionCount++;
  }

  decrementConnectionCount() {
    this.connectionCount--;
  }

  pushProcessingTime(
    msgType: 'REQ' | 'EVENT' | 'CLOSE' | 'AUTH',
    time: number,
  ) {
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

  getMetrics() {
    return {
      startupTime: this.startupTime,
      connectionCount: this.connectionCount,
      reqProcessingTime: this.reqDigest
        .percentile([0.5, 0.75, 0.9, 0.95, 0.99])
        .map((item) => item ?? '--'),
      eventProcessingTime: this.eventDigest
        .percentile([0.5, 0.75, 0.9, 0.95, 0.99])
        .map((item) => item ?? '--'),
      closeProcessingTime: this.closeDigest
        .percentile([0.5, 0.75, 0.9, 0.95, 0.99])
        .map((item) => item ?? '--'),
      authProcessingTime: this.authDigest
        .percentile([0.5, 0.75, 0.9, 0.95, 0.99])
        .map((item) => item ?? '--'),
    };
  }
}
