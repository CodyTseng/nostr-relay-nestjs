import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Event,
  Filter,
  createOutgoingNoticeMessage,
} from '@nostr-relay/common';
import { NostrRelay } from '@nostr-relay/core';
import { Validator } from '@nostr-relay/validator';
import { WotGuard } from '@nostr-relay/wot-guard';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Config } from 'src/config';
import { MessageHandlingConfig } from 'src/config/message-handling.config';
import { WebSocket } from 'ws';
import { ValidationError } from 'zod-validation-error';
import { AccessControlPlugin } from '../plugins';
import { EventRepository } from '../repositories';
import { MetricService } from './metric.service';
import { NostrRelayLogger } from './nostr-relay-logger.service';

@Injectable()
export class NostrRelayService implements OnApplicationBootstrap {
  private readonly relay: NostrRelay;
  private readonly messageHandlingConfig: MessageHandlingConfig;
  private readonly validator: Validator;
  private readonly wotGuardPlugin?: WotGuard;

  constructor(
    @InjectPinoLogger(NostrRelayService.name)
    private readonly logger: PinoLogger,
    private readonly metricService: MetricService,
    nostrRelayLogger: NostrRelayLogger,
    eventRepository: EventRepository,
    configService: ConfigService<Config, true>,
    accessControlPlugin: AccessControlPlugin,
  ) {
    const hostname = configService.get('hostname');
    const limitConfig = configService.get('limit', { infer: true });
    const cacheConfig = configService.get('cache', { infer: true });
    const wotConfig = configService.get('wot', { infer: true });
    this.messageHandlingConfig = configService.get('messageHandling', {
      infer: true,
    });
    this.relay = new NostrRelay(eventRepository, {
      hostname,
      logger: nostrRelayLogger,
      ...limitConfig,
      ...cacheConfig,
    });
    this.validator = new Validator();
    this.relay.register(accessControlPlugin);

    if (wotConfig.trustAnchorPubkey) {
      this.wotGuardPlugin = new WotGuard({
        trustAnchorPubkey: wotConfig.trustAnchorPubkey,
        trustDepth: wotConfig.trustDepth,
        refreshInterval: wotConfig.refreshInterval,
        relayUrls: wotConfig.fetchFollowListFrom,
        skipFilters: wotConfig.skipFilters,
        logger: nostrRelayLogger,
        eventRepository,
      });
      this.relay.register(this.wotGuardPlugin);
    }
  }

  async onApplicationBootstrap() {
    await this.wotGuardPlugin?.init();
  }

  handleConnection(client: WebSocket) {
    this.relay.handleConnection(client);
    this.metricService.incrementConnectionCount();
  }

  handleDisconnect(client: WebSocket) {
    this.relay.handleDisconnect(client);
    this.metricService.decrementConnectionCount();
  }

  async handleMessage(client: WebSocket, data: Array<any>) {
    try {
      const start = Date.now();
      const msg = await this.validator.validateIncomingMessage(data);
      if (!this.messageHandlingConfig[msg[0].toLowerCase()]) {
        return;
      }
      await this.relay.handleMessage(client, msg);
      this.metricService.pushProcessingTime(msg[0], Date.now() - start);
    } catch (error) {
      if (error instanceof ValidationError) {
        return createOutgoingNoticeMessage(error.message);
      }
      this.logger.error(error);
      return createOutgoingNoticeMessage((error as Error).message);
    }
  }

  async handleEvent(event: Event) {
    return await this.relay.handleEvent(event);
  }

  async findEvents(filters: Filter[], pubkey?: string) {
    return await this.relay.findEvents(filters, pubkey);
  }

  async validateEvent(data: any) {
    return await this.validator.validateEvent(data);
  }

  async validateFilter(data: any) {
    return await this.validator.validateFilter(data);
  }

  async validateFilters(data: any) {
    return await this.validator.validateFilters(data);
  }

  checkPubkeyIsTrusted(pubkey: string) {
    return {
      wotEnabled: !!this.wotGuardPlugin,
      trusted: this.wotGuardPlugin
        ? this.wotGuardPlugin.checkPubkey(pubkey)
        : true,
    };
  }
}
