import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { verifySignature, sha256, bytesToHex } from './crypto.utils';
import { WebSocket } from 'ws';

export interface EnhancedWebSocket extends WebSocket {
  id?: string;
  authenticated?: boolean;
  pubkey?: string;
  challenge?: string;
  connectedAt?: Date;
}

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface AuthEvent {
  id: string;
  pubkey: string;
  sig: string;
}

@Injectable()
export class ConnectionManagerService {
  private readonly connections: Map<string, EnhancedWebSocket> = new Map();
  public restrictedKinds = new Set([4]);

  constructor(
    @InjectPinoLogger(ConnectionManagerService.name)
    private readonly logger: PinoLogger,
  ) {}

  registerConnection(client: EnhancedWebSocket): void {
    if (!client.id) {
      this.logger.error('Cannot register client without ID');
      return;
    }
    this.connections.set(client.id, client);
    this.logger.info('Client connected: %s', client.id);
  }

  removeConnection(client: EnhancedWebSocket): void {
    if (client.id) {
      this.connections.delete(client.id);
      this.logger.info('Client disconnected: %s', client.id);
    }
  }

  getConnection(id: string): EnhancedWebSocket | undefined {
    return this.connections.get(id);
  }

  getAllConnections(): Map<string, EnhancedWebSocket> {
    return this.connections;
  }

  getConnections(): Map<string, EnhancedWebSocket> {
    return this.connections;
  }

  async handleAuth(client: EnhancedWebSocket, message: any): Promise<void> {
    try {
      const [_, event] = message;
      if (await this.verifyAuth(event)) {
        client.authenticated = true;
        client.pubkey = event.pubkey;
        this.logger.info('Client authenticated: %s', client.id);
      }
    } catch (error) {
      this.logger.error('Error handling auth: %s', error);
    }
  }

  async handleEvent(client: EnhancedWebSocket, message: any): Promise<void> {
    try {
      const [_, event] = message;
      if (this.requiresAuth(event) && !client.authenticated) {
        this.logger.warn('Unauthenticated client attempting restricted action: %s', client.id);
        return;
      }
      
      if (await this.verifyEventSignature(event)) {
        // Handle verified event
        this.logger.debug('Event verified: %s', event.id);
      } else {
        this.logger.warn('Invalid event signature from client: %s', client.id);
      }
    } catch (error) {
      this.logger.error('Error handling event: %s', error);
    }
  }

  requiresAuth(message: any): boolean {
    const [type, event] = message;
    return type === 'EVENT' && this.restrictedKinds.has(event.kind);
  }

  async verifyAuth(auth: AuthEvent): Promise<boolean> {
    try {
      const id = auth.id;
      const pubkey = auth.pubkey;
      const sig = auth.sig;

      if (!id || !pubkey || !sig) {
        this.logger.error('Missing required auth fields');
        return false;
      }

      return await verifySignature(sig, id, pubkey);
    } catch (error) {
      this.logger.error('Error verifying auth: %s', error);
      return false;
    }
  }

  async verifyEventSignature(event: NostrEvent): Promise<boolean> {
    try {
      const hash = this.getEventHash(event);
      return await verifySignature(event.sig, hash, event.pubkey);
    } catch (error) {
      this.logger.error('Error verifying event signature: %s', error);
      return false;
    }
  }

  getEventHash(event: NostrEvent): string {
    const serialized = JSON.stringify([
      0,
      event.pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content,
    ]);
    return bytesToHex(sha256(new TextEncoder().encode(serialized)));
  }
}
