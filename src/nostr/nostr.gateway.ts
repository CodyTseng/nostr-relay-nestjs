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
import { randomUUID } from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { concatWith, filter, map, of } from 'rxjs';
import { WebSocket, WebSocketServer } from 'ws';
import { RestrictedException } from '../common/exceptions';
import { GlobalExceptionFilter } from '../common/filters';
import { WsThrottlerGuard } from '../common/guards';
import { ZodValidationPipe } from '../common/pipes';
import { Config, LimitConfig } from '../config';
import { MessageType } from './constants';
import { Event, Filter } from './entities';
import {
  CacheEventHandlingResultInterceptor,
  LoggingInterceptor,
} from './interceptors';
import {
  AuthMessageDto,
  CloseMessageDto,
  EventMessageDto,
  ReqMessageDto,
  TopMessageDto,
} from './schemas';
import { EventService } from './services/event.service';
import { SubscriptionService } from './services/subscription.service';
import {
  createAuthResponse,
  createCommandResultResponse,
  createEndOfStoredEventResponse,
  createEventResponse,
  createTopResponse,
} from './utils';

@WebSocketGateway()
@UseInterceptors(LoggingInterceptor)
@UseFilters(GlobalExceptionFilter)
@UseGuards(WsThrottlerGuard)
export class NostrGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly limitConfig: LimitConfig;
  private readonly domain: string;

  constructor(
    @InjectPinoLogger(NostrGateway.name)
    private readonly logger: PinoLogger,
    private readonly subscriptionService: SubscriptionService,
    private readonly eventService: EventService,
    configService: ConfigService<Config, true>,
  ) {
    this.limitConfig = configService.get('limit');
    this.domain = configService.get('domain');
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

  @UseInterceptors(CacheEventHandlingResultInterceptor)
  @SubscribeMessage(MessageType.EVENT)
  async event(
    @MessageBody(new ZodValidationPipe(EventMessageDto))
    [, e]: EventMessageDto,
  ) {
    const event = Event.fromEventDto(e);
    const validateErrorMsg = event.validate({
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
    @MessageBody(new ZodValidationPipe(ReqMessageDto))
    [, subscriptionId, ...filtersDto]: ReqMessageDto,
  ) {
    // only the first ten are valid
    const filters = filtersDto.slice(0, 10).map(Filter.fromFilterDto);

    if (
      filters.some((filter) => filter.hasEncryptedDirectMessageKind()) &&
      !client.pubkey
    ) {
      throw new RestrictedException(
        "we can't serve DMs to unauthenticated users, does your client implement NIP-42?",
      );
    }

    this.subscriptionService.subscribe(client, subscriptionId, filters);

    const event$ = this.eventService.findByFilters(filters);
    return event$.pipe(
      filter((event) => event.checkPermission(client.pubkey)),
      map((event) => createEventResponse(subscriptionId, event)),
      concatWith(of(createEndOfStoredEventResponse(subscriptionId))),
    );
  }

  @SubscribeMessage(MessageType.CLOSE)
  close(
    @ConnectedSocket() client: WebSocket,
    @MessageBody(new ZodValidationPipe(CloseMessageDto))
    [, subscriptionId]: CloseMessageDto,
  ) {
    this.subscriptionService.unSubscribe(client, subscriptionId);
  }

  @SubscribeMessage(MessageType.AUTH)
  auth(
    @ConnectedSocket() client: WebSocket,
    @MessageBody(new ZodValidationPipe(AuthMessageDto))
    [, signedEvent]: AuthMessageDto,
  ) {
    const event = Event.fromEventDto(signedEvent);
    const validateErrorMsg = event.validateSignedEvent(client.id, this.domain);
    if (validateErrorMsg) {
      return createCommandResultResponse(event.id, false, validateErrorMsg);
    }

    client.pubkey = event.pubkey;
    return createCommandResultResponse(event.id, true);
  }

  @SubscribeMessage(MessageType.TOP)
  async top(
    @ConnectedSocket() client: WebSocket,
    @MessageBody(new ZodValidationPipe(TopMessageDto))
    [, subscriptionId, ...filtersDto]: TopMessageDto,
  ) {
    const filters = filtersDto.map(Filter.fromFilterDto);
    if (
      filters.some((filter) => filter.hasEncryptedDirectMessageKind()) &&
      !client.pubkey
    ) {
      throw new RestrictedException(
        "we can't serve DMs to unauthenticated users, does your client implement NIP-42?",
      );
    }

    const topIds = await this.eventService.findTopIds(filters);

    return createTopResponse(subscriptionId, topIds);
  }
}
