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
import { MessageHandlingConfig } from 'src/config/message-handling.config';
import { WebSocket } from 'ws';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { GlobalExceptionFilter } from '../common/filters';
import { WsThrottlerGuard } from '../common/guards';
import { Config } from '../config';
import { LoggingInterceptor } from './interceptors';
import { EventRepository } from './repositories';
import { SubscriptionIdSchema } from './schemas';
import { EventService } from './services/event.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@WebSocketGateway({
  maxPayload: 256 * 1024, // 128 KB
})
@UseInterceptors(LoggingInterceptor)
@UseFilters(GlobalExceptionFilter)
@UseGuards(WsThrottlerGuard)
export class NostrGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly relay: NostrRelay;
  private readonly validator: Validator;
  private readonly messageHandlingConfig: MessageHandlingConfig;

  constructor(
    private readonly eventService: EventService,
    eventRepository: EventRepository,
    configService: ConfigService<Config, true>,
    @InjectPinoLogger()
    logger: PinoLogger,
  ) {
    const domain = configService.get('domain');
    const limitConfig = configService.get('limit', { infer: true });
    this.messageHandlingConfig = configService.get('messageHandling', {
      infer: true,
    });
    this.relay = new NostrRelay(eventRepository, {
      domain,
      logger: {
        error: (context, error) => logger.error({ err: error, context }),
      },
      ...limitConfig,
    });
    this.validator = new Validator();
  }

  handleConnection(client: WebSocket) {
    this.relay.handleConnection(client);
  }

  handleDisconnect(client: WebSocket) {
    this.relay.handleDisconnect(client);
  }

  @SubscribeMessage('DEFAULT')
  async handleMessage(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: Array<any>,
  ) {
    const msg = await this.validator.validateIncomingMessage(data);
    if (!this.messageHandlingConfig[msg[0].toLowerCase()]) {
      return;
    }
    await this.relay.handleMessage(client, msg);
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
      return createOutgoingNoticeMessage((error as Error).message);
    }
  }
}
