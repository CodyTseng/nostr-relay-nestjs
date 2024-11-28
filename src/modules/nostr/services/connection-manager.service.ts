import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Config } from '../../../config';
import { SecurityConfig } from '../../../config/security.config';
import { EnhancedWebSocket } from '../gateway/enhanced-ws-adapter';

@Injectable()
export class ConnectionManagerService {
  private readonly ipConnections: Map<string, Set<EnhancedWebSocket>> = new Map();
  private readonly clientAuthTimeouts: Map<EnhancedWebSocket, NodeJS.Timeout> = new Map();
  private readonly securityConfig: SecurityConfig;

  constructor(
    @InjectPinoLogger(ConnectionManagerService.name)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService<Config, true>,
  ) {
    const securityConfig = this.configService.get<SecurityConfig>('security');
    if (!securityConfig) {
      throw new Error('Security configuration is required');
    }
    this.securityConfig = securityConfig;
  }

  canConnect(ip: string): boolean {
    const connections = this.ipConnections.get(ip)?.size ?? 0;
    return connections < this.securityConfig.websocket.maxConnectionsPerIp;
  }

  registerConnection(client: EnhancedWebSocket, ip: string): void {
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

  removeConnection(client: EnhancedWebSocket, ip: string): void {
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

  markAuthenticated(client: EnhancedWebSocket): void {
    client.authenticated = true;
    const timeout = this.clientAuthTimeouts.get(client);
    if (timeout) {
      clearTimeout(timeout);
      this.clientAuthTimeouts.delete(client);
    }
  }
}
