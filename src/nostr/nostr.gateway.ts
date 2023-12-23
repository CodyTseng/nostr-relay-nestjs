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
import { MessageHandlingConfig } from 'src/config/message-handling.config';
import { RawData, WebSocket } from 'ws';
import { GlobalExceptionFilter } from '../common/filters';
import { WsThrottlerGuard } from '../common/guards';
import { Config } from '../config';
import { LoggingInterceptor } from './interceptors';
import { PgEventRepository } from './repositories';

type Data = string | Buffer | ArrayBuffer | Buffer[];

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
    eventRepository: PgEventRepository,
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
    @MessageBody() data: RawData,
  ) {
    const msg = await this.validator.validateIncomingMessage(data);
    if (!this.messageHandlingConfig[msg[0].toLowerCase()]) {
      return;
    }
    await this.relay.handleMessage(client, msg);
  }

  // @SubscribeMessage(MessageType.TOP)
  // async top(
  //   @ConnectedSocket() client: WebSocket,
  //   @MessageBody(new ZodValidationPipe(TopMessageDto))
  //   [, subscriptionId, ...filtersDto]: TopMessageDto,
  // ) {
  //   const filters = filtersDto.map(Filter.fromFilterDto);
  //   if (
  //     filters.some((filter) => filter.hasEncryptedDirectMessageKind()) &&
  //     !client.pubkey
  //   ) {
  //     throw new RestrictedException(
  //       "we can't serve DMs to unauthenticated users, does your client implement NIP-42?",
  //     );
  //   }

  //   const topIds = await this.eventService.findTopIds(filters);

  //   return createTopResponse(subscriptionId, topIds);
  // }
}
