import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Config } from '../../../config';
import { SecurityConfig } from '../../../config/security.config';
import { WebSocket } from 'ws';

@Injectable()
export class ConnectionManagerService {
  private readonly ipConnections: Map<string, Set<WebSocket>> = new Map();
  private readonly clientAuthTimeouts: Map<WebSocket, NodeJS.Timeout> = new Map();
  private readonly securityConfig: SecurityConfig;

  constructor(
    @InjectPinoLogger(ConnectionManagerService.name)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService<Config, true>,
  ) {
    this.securityConfig = this.configService.get('security', { infer: true });
  }

  canConnect(ip: string): boolean {
    const connections = this.ipConnections.get(ip)?.size ?? 0;
    return connections < this.securityConfig.websocket.maxConnectionsPerIp;
  }

  registerConnection(client: WebSocket, ip: string): void {
    if (!this.ipConnections.has(ip)) {
      this.ipConnections.set(ip, new Set());
    }
    this.ipConnections.get(ip)?.add(client);

    // Set authentication timeout
    const timeout = setTimeout(() => {
      if (!client.authenticated) {
        this.logger.warn({ ip }, 'Client authentication timeout');
        client.close(1008, 'Authentication timeout');
        this.removeConnection(client, ip);
      }
    }, this.securityConfig.websocket.authTimeout);

    this.clientAuthTimeouts.set(client, timeout);
  }

  removeConnection(client: WebSocket, ip: string): void {
    this.ipConnections.get(ip)?.delete(client);
    if (this.ipConnections.get(ip)?.size === 0) {
      this.ipConnections.delete(ip);
    }

    // Clear auth timeout
    const timeout = this.clientAuthTimeouts.get(client);
    if (timeout) {
      clearTimeout(timeout);
      this.clientAuthTimeouts.delete(client);
    }
  }

  markAuthenticated(client: WebSocket): void {
    (client as any).authenticated = true;
    const timeout = this.clientAuthTimeouts.get(client);
    if (timeout) {
      clearTimeout(timeout);
      this.clientAuthTimeouts.delete(client);
    }
  }
}
