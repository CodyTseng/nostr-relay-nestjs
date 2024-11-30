import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EnhancedWebSocket } from '../nostr/gateway/custom-ws-adapter';

@Injectable()
export class ConnectionManagerService {
  private readonly connections: Set<EnhancedWebSocket> = new Set();

  constructor(
    @InjectPinoLogger(ConnectionManagerService.name)
    private readonly logger: PinoLogger,
  ) {}

  registerConnection(client: EnhancedWebSocket): void {
    this.connections.add(client);
  }

  removeConnection(client: EnhancedWebSocket): void {
    this.connections.delete(client);
  }

  getConnections(): Set<EnhancedWebSocket> {
    return this.connections;
  }
}
