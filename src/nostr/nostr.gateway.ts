import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { NostrRelay } from '@nostr-relay/core';
import { Validator } from '@nostr-relay/validator';
import { WebSocket } from 'ws';
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
export class NostrGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly relay: NostrRelay;
  private readonly validator: Validator;

  constructor(
    configService: ConfigService<Config, true>,
    eventRepository: PgEventRepository,
  ) {
    const limitConfig = configService.get('limit', { infer: true });
    const domain = configService.get('domain');
    this.relay = new NostrRelay({
      domain,
      eventRepository,
      // TODO: logger
      options: limitConfig,
    });
    this.validator = new Validator();
  }

  afterInit(server: any) {
    console.log('init');
  }

  handleConnection(client: WebSocket) {
    console.log('connection');
    this.relay.handleConnection(client);
  }

  handleDisconnect(client: WebSocket) {
    this.relay.handleDisconnect(client);
  }

  @SubscribeMessage('default')
  async handleMessage(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: Data,
  ) {
    const msg = this.validator.transformAndValidate(data);
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
