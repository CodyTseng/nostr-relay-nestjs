import { UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { isNil } from 'lodash';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { concatWith, from, map, of } from 'rxjs';
import { WebSocket, WebSocketServer } from 'ws';
import { WsExceptionFilter } from '../common/filters';
import { ZodValidationPipe } from '../common/pipes';
import { Config, LimitConfig } from '../config';
import { MessageType } from './constants';
import {
  CloseMessage,
  CloseMessageSchema,
  EventMessage,
  EventMessageSchema,
  ReqMessage,
  ReqMessageSchema,
} from './schemas';
import { EventService } from './services/event.service';
import { SubscriptionService } from './services/subscription.service';
import {
  createCommandResultResponse,
  createEndOfStoredEventResponse,
  createEventResponse,
  isEventIdValid,
  isEventSigValid,
} from './utils';

@WebSocketGateway()
@UseFilters(WsExceptionFilter)
export class NostrGateway implements OnGatewayInit, OnGatewayDisconnect {
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

  handleDisconnect(client: WebSocket) {
    this.subscriptionService.clear(client);
  }

  @SubscribeMessage(MessageType.EVENT)
  async event(
    @MessageBody(new ZodValidationPipe(EventMessageSchema))
    [event]: EventMessage,
  ) {
    if (!(await isEventIdValid(event))) {
      return createCommandResultResponse(
        event.id,
        false,
        'invalid: id is wrong',
      );
    }
    if (!(await isEventSigValid(event))) {
      return createCommandResultResponse(
        event.id,
        false,
        'invalid: signature is wrong',
      );
    }
    if (
      !isNil(this.limitConfig.createdAt.upper) &&
      event.created_at - Date.now() / 1000 > this.limitConfig.createdAt.upper
    ) {
      return createCommandResultResponse(
        event.id,
        false,
        `invalid: created_at must not be later than ${this.limitConfig.createdAt.upper} seconds from the current time.`,
      );
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
    [subscriptionId, ...filters]: ReqMessage,
  ) {
    this.subscriptionService.subscribe(client, subscriptionId, filters);

    const events = await this.eventService.findByFilters(filters);
    return from(events).pipe(
      map((event) => createEventResponse(subscriptionId, event)),
      concatWith(of(createEndOfStoredEventResponse(subscriptionId))),
    );
  }

  @SubscribeMessage(MessageType.CLOSE)
  close(
    @ConnectedSocket() client: WebSocket,
    @MessageBody(new ZodValidationPipe(CloseMessageSchema))
    [subscriptionId]: CloseMessage,
  ) {
    this.subscriptionService.unSubscribe(client, subscriptionId);
  }
}
