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
import { NostrRelay } from '@nostr-relay/core';
import { Validator } from '@nostr-relay/validator';
import { chain } from 'lodash';
import { MessageHandlingConfig } from 'src/config/message-handling.config';
import { WebSocket } from 'ws';
import { GlobalExceptionFilter } from '../common/filters';
import { WsThrottlerGuard } from '../common/guards';
import { Config } from '../config';
import { LoggingInterceptor } from './interceptors';
import { PgEventRepository } from './repositories';
import { SubscriptionIdSchema } from './schemas';

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
    configService: ConfigService<Config, true>,
    private readonly eventRepository: PgEventRepository,
  ) {
    const domain = configService.get('domain');
    const limitConfig = configService.get('limit', { infer: true });
    this.messageHandlingConfig = configService.get('messageHandling', {
      infer: true,
    });
    this.relay = new NostrRelay(eventRepository, {
      domain,
      // TODO: logger
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

  @SubscribeMessage('default')
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
    if (msg.length <= 2) return;
    const validateSubscriptionIdResult =
      await SubscriptionIdSchema.safeParseAsync(msg[1]);
    if (!validateSubscriptionIdResult.success) return;
    const subscriptionId = validateSubscriptionIdResult.data;

    const filters = await Promise.all(
      msg.slice(2).map((filterDto) => this.validator.validateFilter(filterDto)),
    );

    const collection = await Promise.all([
      ...filters.map((filter) =>
        this.eventRepository.findTopIdsWithScore(filter),
      ),
    ]);

    const topIds = chain(collection)
      .flatten()
      .uniqBy('id')
      .sortBy((item) => -item.score)
      .map('id')
      .take(1000)
      .value();

    return ['TOP', subscriptionId, topIds];
  }
}
