import { Injectable } from '@nestjs/common';
import { MessageType } from '@nostr-relay/common';
import { Digest } from 'tdigest';

@Injectable()
export class MetricService {
  private connectionCount = 0;
  private reqDigest = new Digest();
  private eventDigest = new Digest();
  private closeDigest = new Digest();
  private authDigest = new Digest();
  private reqRequestCount = 0;
  private eventRequestCount = 0;
  private closeRequestCount = 0;
  private authRequestCount = 0;

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
        this.reqRequestCount++;
        break;
      case MessageType.EVENT:
        this.eventDigest.push(time);
        this.eventRequestCount++;
        break;
      case MessageType.CLOSE:
        this.closeDigest.push(time);
        this.closeRequestCount++;
        break;
      case MessageType.AUTH:
        this.authDigest.push(time);
        this.authRequestCount++;
        break;
    }
  }

  getMetrics() {
    return {
      connectionCount: this.connectionCount,
      reqProcessingTime: this.reqDigest.percentile([0.5, 0.95, 0.99]),
      reqRequestCount: this.reqRequestCount,
      eventProcessingTime: this.eventDigest.percentile([0.5, 0.95, 0.99]),
      eventRequestCount: this.eventRequestCount,
      closeProcessingTime: this.closeDigest.percentile([0.5, 0.95, 0.99]),
      closeRequestCount: this.closeRequestCount,
      authProcessingTime: this.authDigest.percentile([0.5, 0.95, 0.99]),
      authRequestCount: this.authRequestCount,
    };
  }
}
