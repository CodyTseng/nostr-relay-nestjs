import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { verify } from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
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

@Injectable()
export class ConnectionManagerService {
  private readonly connections: Map<string, EnhancedWebSocket> = new Map();
  public restrictedKinds = new Set([4]);

  constructor(
    @InjectPinoLogger(ConnectionManagerService.name)
    private readonly logger: PinoLogger,
  ) {}

  registerConnection(client: EnhancedWebSocket): void {
    this.connections.set(client.id!, client);
    this.logger.info('Client connected: %s', client.id);
  }

  removeConnection(client: EnhancedWebSocket): void {
    this.connections.delete(client.id!);
    this.logger.info('Client disconnected: %s', client.id);
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

  handleAuth(client: EnhancedWebSocket, message: any): void {
    if (message[0] === 'AUTH') {
      const event = message[1];
      if (this.verifyEventSignature(event)) {
        client.authenticated = true;
        client.pubkey = event.pubkey;
        this.logger.info('Client authenticated: %s with pubkey: %s', client.id, client.pubkey);
      }
    }
  }

  requiresAuth(message: any): boolean {
    if (!Array.isArray(message)) return false;
    if (message[0] !== 'EVENT') return false;
    const event = message[1];
    return this.restrictedKinds.has(event.kind);
  }

  verifyEventSignature(event: NostrEvent): boolean {
    try {
      const hash = this.getEventHash(event);
      return verify(
        event.sig,
        hash,
        event.pubkey,
      );
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
