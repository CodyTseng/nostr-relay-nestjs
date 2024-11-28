import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Event,
  Filter,
  createOutgoingNoticeMessage,
} from '@nostr-relay/common';
import { NostrRelay } from '@nostr-relay/core';
import { CreatedAtLimitGuard } from '@nostr-relay/created-at-limit-guard';
import { OrGuard } from '@nostr-relay/or-guard';
import { PowGuard } from '@nostr-relay/pow-guard';
import { Throttler } from '@nostr-relay/throttler';
import type { ThrottlerOptions } from '@nestjs/throttler';
import { Validator } from '@nostr-relay/validator';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Config } from 'src/config';
import { MessageHandlingConfig } from 'src/config/message-handling.config';
import { WebSocket } from 'ws';
import { ValidationError } from 'zod-validation-error';
import { WotService } from '../../../modules/wot/wot.service';
import { MetricService } from '../../metric/metric.service';
import { EventRepository } from '../../repositories/event.repository';
import { NostrRelayLogger } from '../../share/nostr-relay-logger.service';
import { BlacklistGuardPlugin, WhitelistGuardPlugin } from '../plugins';
import { ReportEventValidator } from '../validators/report-event.validator';

@Injectable()
export class NostrRelayService implements OnApplicationShutdown {
  private readonly relay: NostrRelay;
  private readonly messageHandlingConfig: MessageHandlingConfig;
  private readonly validator: Validator;
  private readonly throttler: Throttler;

  constructor(
    @InjectPinoLogger(NostrRelayService.name)
    private readonly logger: PinoLogger,
    private readonly metricService: MetricService,
    nostrRelayLogger: NostrRelayLogger,
    eventRepository: EventRepository,
    configService: ConfigService<Config, true>,
    wotService: WotService,
    private readonly reportEventValidator: ReportEventValidator,
  ) {
    const hostname = configService.get('hostname');
    const limitConfig = configService.get('limit', { infer: true });
    const {
      createdAtLowerLimit,
      createdAtUpperLimit,
      minPowDifficulty,
      maxSubscriptionsPerClient,
      blacklist,
      whitelist,
    } = limitConfig;
    const cacheConfig = configService.get('cache', { infer: true });
    const throttlerConfig = configService.get('throttler.ws', { infer: true });
    this.messageHandlingConfig = configService.get('messageHandling', {
      infer: true,
    });
    this.relay = new NostrRelay(eventRepository, {
      hostname,
      logger: nostrRelayLogger,
      maxSubscriptionsPerClient,
      ...cacheConfig,
    });
    this.validator = new Validator();

    const throttlerOptions: ThrottlerOptions = {
      name: 'event',
      ttl: throttlerConfig.EVENT.ttl,
      limit: throttlerConfig.EVENT.limit
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

    const orGuardPlugin = new OrGuard(wotService.getWotGuardPlugin());

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

  handleConnection(client: WebSocket, ip = 'unknown') {
    this.relay.handleConnection(client, ip);
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

  async validateEvent(data: any): Promise<Event> {
    // Validate report events
    const reportValidationError = this.reportEventValidator.validate(data);
    if (reportValidationError) {
      throw new Error(reportValidationError);
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
}
