import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { EnhancedWebSocket } from '../gateway/custom-ws-adapter';
import * as crypto from 'crypto';

@Injectable()
export class ConnectionManagerService {
  private readonly connections: Set<EnhancedWebSocket> = new Set();
  private readonly restrictedKinds = new Set([4]);

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

  // NIP-42: Handle AUTH message
  async handleAuth(client: EnhancedWebSocket, message: any[]): Promise<void> {
    try {
      // If message length is 1, this is a challenge request
      if (message.length === 1) {
        const challenge = Buffer.from(crypto.randomBytes(32)).toString('hex');
        client.challenge = challenge;
        client.send(JSON.stringify(["AUTH", challenge]));
        return;
      }

      // AUTH message format: ["AUTH", signedEvent]
      if (message.length !== 2) {
        client.send(JSON.stringify(["NOTICE", "Invalid AUTH message format"]));
        return;
      }

      const event = message[1];
      
      // Verify the event has the correct kind and challenge
      if (event.kind !== 22242) {
        client.send(JSON.stringify(["NOTICE", "Invalid event kind"]));
        return;
      }

      const challengeTag = event.tags.find(tag => tag[0] === 'challenge');
      if (!challengeTag || challengeTag[1] !== client.challenge) {
        client.send(JSON.stringify(["NOTICE", "Invalid challenge"]));
        return;
      }

      // Verify the event signature
      const verified = await this.verifyEventSignature(event);
      if (!verified) {
        client.send(JSON.stringify(["NOTICE", "Invalid signature"]));
        return;
      }

      // Mark client as authenticated
      client.authenticated = true;
      this.logger.info({ clientId: client.id }, 'Client authenticated successfully');
      client.send(JSON.stringify(["OK", event.id, true, ""]));
    } catch (error) {
      this.logger.error({ error, clientId: client.id }, 'Authentication failed');
      client.send(JSON.stringify(["NOTICE", "Authentication failed"]));
    }
  }

  private async verifyEventSignature(event: any): Promise<boolean> {
    try {
      const eventHash = await this.getEventHash(event);
      const signature = event.sig;
      const publicKey = event.pubkey;

      if (!signature || !publicKey) {
        this.logger.debug('Missing signature or public key');
        return false;
      }

      this.logger.debug({
        eventHash,
        signature,
        publicKey,
      }, 'Verifying signature with parameters');

      // Convert hex strings to Uint8Arrays
      const msgHash = Uint8Array.from(Buffer.from(eventHash, 'hex'));
      const sig = Uint8Array.from(Buffer.from(signature, 'hex'));
      const pubkey = Uint8Array.from(Buffer.from(publicKey, 'hex'));

      const result = await secp256k1.verify(sig, msgHash, pubkey);

      this.logger.debug({ result }, 'Signature verification result');
      return result;
    } catch (error) {
      this.logger.error({ error }, 'Error verifying signature');
      return false;
    }
  }

  private async getEventHash(event: any): Promise<string> {
    const serialized = JSON.stringify([
      0,
      event.pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content
    ]);

    return Buffer.from(sha256(Buffer.from(serialized))).toString('hex');
  }

  // Check if a message requires authentication
  requiresAuth(message: any[]): boolean {
    if (message.length < 2) return false;
    const [type, event] = message;
    return type === 'EVENT' && this.restrictedKinds.has(event.kind);
  }

  // Handle admin commands
  handleAdminCommand(client: EnhancedWebSocket, message: any[]): void {
    if (message[0] === 'ADMIN' && message[1] === 'GET_CONNECTIONS') {
      const connectionInfo = {
        total: this.connections.size,
        active: this.connections.size,
        authenticated: Array.from(this.connections).filter(c => c.authenticated).length,
        connections: Array.from(this.connections).map(conn => ({
          id: conn.id,
          authenticated: conn.authenticated,
          connectedAt: conn.connectedAt
        }))
      };
      client.send(JSON.stringify(['CONNECTIONS', connectionInfo]));
    }
  }
}
