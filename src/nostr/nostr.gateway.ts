import { UseFilters } from '@nestjs/common';
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
import { randomUUID } from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { concatWith, filter, from, map, of } from 'rxjs';
import { WebSocket, WebSocketServer } from 'ws';
import { WsExceptionFilter } from '../common/filters';
import { ZodValidationPipe } from '../common/pipes';
import { Config, LimitConfig } from '../config';
import { MessageType } from './constants';
import { Event, Filter } from './entities';
import {
  AuthMessageSchema,
  CloseMessageDto,
  CloseMessageSchema,
  CountMessageDto,
  CountMessageSchema,
  EventMessageDto,
  EventMessageSchema,
  ReqMessageDto,
  ReqMessageSchema,
} from './schemas';
import { AuthMessageDto } from './schemas/message-dto.schema';
import { EventService } from './services/event.service';
import { SubscriptionService } from './services/subscription.service';
import {
  createAuthResponse,
  createCommandResultResponse,
  createCountResponse,
  createEndOfStoredEventResponse,
  createEventResponse,
} from './utils';

@WebSocketGateway()
@UseFilters(WsExceptionFilter)
export class NostrGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly limitConfig: LimitConfig;

  constructor(
    @InjectPinoLogger(NostrGateway.name)
    private readonly logger: PinoLogger,
    private readonly subscriptionService: SubscriptionService,
    private readonly eventService: EventService,
    configService: ConfigService<Config, true>,
  ) {
    this.limitConfig = configService.get('limit', {
      infer: true,
    });
  }

  afterInit(server: WebSocketServer) {
    this.subscriptionService.setServer(server);
  }

  handleConnection(client: WebSocket) {
    client.id = randomUUID();
    client.send(JSON.stringify(createAuthResponse(client.id)));
  }

  handleDisconnect(client: WebSocket) {
    this.subscriptionService.clear(client);
  }

  @SubscribeMessage(MessageType.EVENT)
  async event(
    @MessageBody(new ZodValidationPipe(EventMessageSchema))
    [e]: EventMessageDto,
  ) {
    const event = Event.fromEventDto(e);
    const validateErrorMsg = await event.validate({
      createdAtUpperLimit: this.limitConfig.createdAt.upper,
      eventIdMinLeadingZeroBits: this.limitConfig.eventId.minLeadingZeroBits,
    });
    if (validateErrorMsg) {
      return createCommandResultResponse(event.id, false, validateErrorMsg);
    }

    try {
      return await this.eventService.handleEvent(event);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof Error) {
        return createCommandResultResponse(
          event.id,
          false,
          'error: ' + error.message,
        );
      }
    }
  }

  @SubscribeMessage(MessageType.REQ)
  async req(
    @ConnectedSocket() client: WebSocket,
    @MessageBody(new ZodValidationPipe(ReqMessageSchema))
    [subscriptionId, ...filtersDto]: ReqMessageDto,
  ) {
    const filters = filtersDto.map(Filter.fromFilterDto);

    if (
      filters.some((filter) => filter.hasEncryptedDirectMessageKind()) &&
      !client.pubkey
    ) {
      throw new Error(
        "restricted: we can't serve DMs to unauthenticated users, does your client implement NIP-42?",
      );
    }

    this.subscriptionService.subscribe(client, subscriptionId, filters);

    const events = await this.eventService.findByFilters(filters);
    return from(events).pipe(
      filter((event) => event.checkPermission(client.pubkey)),
      map((event) => createEventResponse(subscriptionId, event)),
      concatWith(of(createEndOfStoredEventResponse(subscriptionId))),
    );
  }

  @SubscribeMessage(MessageType.CLOSE)
  close(
    @ConnectedSocket() client: WebSocket,
    @MessageBody(new ZodValidationPipe(CloseMessageSchema))
    [subscriptionId]: CloseMessageDto,
  ) {
    this.subscriptionService.unSubscribe(client, subscriptionId);
  }

  @SubscribeMessage(MessageType.COUNT)
  async count(
    @ConnectedSocket() client: WebSocket,
    @MessageBody(new ZodValidationPipe(CountMessageSchema))
    [subscriptionId, ...filtersDto]: CountMessageDto,
  ) {
    const filters = filtersDto.map(Filter.fromFilterDto);
    if (
      filters.some((filter) => filter.hasEncryptedDirectMessageKind()) &&
      !client.pubkey
    ) {
      throw new Error(
        "restricted: we can't serve DMs to unauthenticated users, does your client implement NIP-42?",
      );
    }

    const count = await this.eventService.countByFilters(filters);
    return createCountResponse(subscriptionId, count);
  }

  @SubscribeMessage(MessageType.AUTH)
  async auth(
    @ConnectedSocket() client: WebSocket,
    @MessageBody(new ZodValidationPipe(AuthMessageSchema))
    [signedEvent]: AuthMessageDto,
  ) {
    const event = Event.fromEventDto(signedEvent);
    const validateErrorMsg = await event.validate();
    if (validateErrorMsg) return;

    return this.eventService.handleSignedEvent(client, event);
  }
}
