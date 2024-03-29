import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { NostrRelay, createOutgoingNoticeMessage } from '@nostr-relay/core';
import { Validator } from '@nostr-relay/validator';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MessageHandlingConfig } from 'src/config/message-handling.config';
import { WebSocket } from 'ws';
import { ZodError } from 'zod';
import { ValidationError, fromZodError } from 'zod-validation-error';
import { GlobalExceptionFilter } from '../common/filters';
import { WsThrottlerGuard } from '../common/guards';
import { Config } from '../config';
import { LoggingInterceptor } from './interceptors';
import { AccessControlPlugin } from './plugins';
import { EventRepository } from './repositories';
import { SubscriptionIdSchema } from './schemas';
import { EventService } from './services/event.service';
import { NostrRelayLogger } from './services/nostr-relay-logger.service';
import { MetricService } from './services/metric.service';

@WebSocketGateway({
  maxPayload: 256 * 1024, // 256KB
})
@UseInterceptors(LoggingInterceptor)
@UseFilters(GlobalExceptionFilter)
@UseGuards(WsThrottlerGuard)
export class NostrGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly relay: NostrRelay;
  private readonly validator: Validator;
  private readonly messageHandlingConfig: MessageHandlingConfig;

  constructor(
    @InjectPinoLogger(NostrGateway.name)
    private readonly logger: PinoLogger,
    private readonly eventService: EventService,
    private readonly metricService: MetricService,
    nostrRelayLogger: NostrRelayLogger,
    eventRepository: EventRepository,
    configService: ConfigService<Config, true>,
    accessControlPlugin: AccessControlPlugin,
  ) {
    const domain = configService.get('domain');
    const limitConfig = configService.get('limit', { infer: true });
    const cacheConfig = configService.get('cache', { infer: true });
    this.messageHandlingConfig = configService.get('messageHandling', {
      infer: true,
    });
    this.relay = new NostrRelay(eventRepository, {
      domain,
      logger: nostrRelayLogger,
      ...limitConfig,
      ...cacheConfig,
    });
    this.validator = new Validator();

    this.relay.register(accessControlPlugin);
  }

  handleConnection(client: WebSocket) {
    this.relay.handleConnection(client);
    this.metricService.incrementConnectionCount();
  }

  handleDisconnect(client: WebSocket) {
    this.relay.handleDisconnect(client);
    this.metricService.decrementConnectionCount();
  }

  @SubscribeMessage('DEFAULT')
  async handleMessage(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: Array<any>,
  ) {
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

  @SubscribeMessage('TOP')
  async top(@MessageBody() msg: Array<any>) {
    if (!this.messageHandlingConfig.top) {
      return;
    }

    if (msg.length <= 2) return;

    try {
      const subscriptionId = await SubscriptionIdSchema.parseAsync(msg[1]);

      const filters = await Promise.all(
        msg
          .slice(2)
          .map((filterDto) => this.validator.validateFilter(filterDto)),
      );

      const topIds = await this.eventService.findTopIds(filters);

      return ['TOP', subscriptionId, topIds];
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedError = fromZodError(error, {
          prefix: 'invalid',
          maxIssuesInMessage: 1,
        });
        return createOutgoingNoticeMessage(formattedError.message);
      }
      this.logger.error(error);
      return createOutgoingNoticeMessage((error as Error).message);
    }
  }
}
