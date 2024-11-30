import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionManagerService, EnhancedWebSocket } from '@/modules/connection-manager/connection-manager.service';
import { NostrValidatorService } from './nostr-validator.service';
import { NostrRelay } from '@nostr-relay/core';
import { PowGuard } from '@nostr-relay/pow-guard';
import { Throttler } from '@nostr-relay/throttler';
import { ThrottlerOptions } from '@nestjs/throttler';
import { Config } from '@/config';
import { MetricService } from '../../metric/metric.service';
import { EventRepository } from '../../repositories/event.repository';
import { NostrRelayLogger } from '../../share/nostr-relay-logger.service';
import { BlacklistGuardPlugin, WhitelistGuardPlugin } from '../plugins';
import { GroupEventValidator } from '../validators/group-event.validator';
import { ReportEventValidator } from '../validators/report-event.validator';
import { WotService } from '../../../modules/wot/wot.service';
import { CreatedAtLimitGuard } from '@nostr-relay/created-at-limit-guard';
import { OrGuard } from '@nostr-relay/or-guard';
import { IncomingMessage } from '@nostr-relay/common';

interface ThrottlerConfig {
  ttl: number;
  limit: number;
}

@Injectable()
export class NostrRelayService {
  private readonly relay: NostrRelay;
  private readonly throttler: Throttler;

  constructor(
    private readonly logger: Logger,
    private readonly metricService: MetricService,
    private readonly eventRepository: EventRepository,
    private readonly connectionManager: ConnectionManagerService,
    private readonly validator: NostrValidatorService,
    private readonly configService: ConfigService<Config>,
    private readonly wotService: WotService,
    private readonly nostrRelayLogger: NostrRelayLogger,
    private readonly reportEventValidator: ReportEventValidator,
    private readonly groupEventValidator: GroupEventValidator,
  ) {
    const {
      createdAtLowerLimit,
      createdAtUpperLimit,
      minPowDifficulty,
      maxSubscriptionsPerClient,
      blacklist,
      whitelist,
      cacheConfig,
      throttlerConfig,
      hostname,
    } = this.configService.get('messageHandling', {});

    this.relay = new NostrRelay(this.eventRepository, {
      hostname,
      logger: this.nostrRelayLogger,
      maxSubscriptionsPerClient,
      ...cacheConfig,
    });

    // Initialize throttler with default values if not configured
    const ttl = throttlerConfig?.EVENT?.ttl ?? 60000;
    const limit = throttlerConfig?.EVENT?.limit ?? 100;
    const throttlerOptions: ThrottlerOptions = {
      ttl,
      limit,
    };
    this.throttler = new Throttler(throttlerOptions as any);
    this.relay.register(this.throttler);

    if (createdAtLowerLimit || createdAtUpperLimit) {
      this.relay.register(
        new CreatedAtLimitGuard({
          lowerLimit: createdAtLowerLimit,
          upperLimit: createdAtUpperLimit,
        }),
      );
    }

    const orGuardPlugin = new OrGuard(this.wotService.getWotGuardPlugin());

    if (minPowDifficulty > 0) {
      this.relay.register(new PowGuard(minPowDifficulty));
    }

    if (blacklist?.length) {
      const blacklistGuardPlugin = new BlacklistGuardPlugin(blacklist);
      this.relay.register(blacklistGuardPlugin);
    }

    if (whitelist?.length) {
      const whitelistGuardPlugin = new WhitelistGuardPlugin(whitelist);
      orGuardPlugin.addGuard(whitelistGuardPlugin);
    }

    this.relay.register(orGuardPlugin);
  }

  onApplicationShutdown() {
    this.throttler.destroy();
  }

  handleConnection(client: EnhancedWebSocket, ip = 'unknown') {
    this.relay.handleConnection(client, ip);
    this.metricService.incrementConnectionCount();
  }

  handleDisconnect(client: EnhancedWebSocket) {
    this.relay.handleDisconnect(client);
    this.metricService.decrementConnectionCount();
  }

  async handleMessage(client: EnhancedWebSocket, message: any[]): Promise<void> {
    if (message[0] === 'ADMIN') {
      this.handleAdminMessage(client, message);
      return;
    }

    try {
      const start = Date.now();
      const msg = await this.validator.validateIncomingMessage(message);
      if (!this.configService.get('messageHandling')[msg[0].toLowerCase()]) {
        return;
      }

      await this.relay.handleMessage(client, msg as IncomingMessage);
      const end = Date.now();
      this.metricService.pushProcessingTime(msg[0], end - start);
      this.logger.debug('Message processed in %dms', end - start);
    } catch (error) {
      if (error instanceof Error) {
        client.send(JSON.stringify(['NOTICE', error.message]));
        this.logger.error('Error handling message: %s', error);
      }
    }
  }

  private handleAdminMessage(client: EnhancedWebSocket, message: any[]): void {
    if (message[1] === 'GET_CONNECTIONS') {
      const connections = this.connectionManager.getConnections();
      const connectionEntries = Array.from(connections.entries());
      const connectionInfo = {
        total: connectionEntries.length,
        active: connectionEntries.length,
        authenticated: connectionEntries.filter(([_, c]: [string, EnhancedWebSocket]) => c.authenticated).length,
        connections: connectionEntries.map(([_, conn]: [string, EnhancedWebSocket]) => ({
          id: conn.id,
          authenticated: conn.authenticated,
          connectedAt: conn.connectedAt
        }))
      };
      client.send(JSON.stringify(['CONNECTIONS', connectionInfo]));
    }
  }

  async handleEvent(event: any) {
    return await this.relay.handleEvent(event);
  }

  async findEvents(filters: any[], pubkey?: string) {
    return await this.relay.findEvents(filters, pubkey);
  }

  async validateEvent(data: any): Promise<any> {
    // Validate report events
    const reportValidationError = this.reportEventValidator.validate(data);
    if (reportValidationError) {
      throw new Error(reportValidationError);
    }

    // Validate group events
    const groupValidationError = this.groupEventValidator.validate(data);
    if (groupValidationError) {
      throw new Error(groupValidationError);
    }

    // Continue with existing validation...
    return await this.validator.validateEvent(data);
  }

  async validateFilter(data: any) {
    return await this.validator.validateFilter(data);
  }

  async validateFilters(data: any) {
    return await this.validator.validateFilters(data);
  }

  async getStats(): Promise<any> {
    try {
      const connections = this.connectionManager.getConnections();
      const connectionEntries = Array.from(connections.entries());
      
      const authenticatedCount = connectionEntries
        .filter(([_, client]: [string, EnhancedWebSocket]) => client.authenticated)
        .length;

      const connectedClients = connectionEntries
        .map(([_, client]: [string, EnhancedWebSocket]) => ({
          id: client.id,
          authenticated: client.authenticated,
          pubkey: client.pubkey,
          connectedAt: client.connectedAt
        }));

      return {
        authenticated: authenticatedCount,
        connections: connectedClients,
      };
    } catch (error) {
      this.logger.error('Error getting stats: %s', error);
      throw error;
    }
  }
}
