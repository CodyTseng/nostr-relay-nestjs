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
import { createOutgoingNoticeMessage } from '@nostr-relay/common';
import { IncomingMessage } from 'http';
import { Logger } from '@nestjs/common';
import { Config } from 'src/config';
import { MessageHandlingConfig } from 'src/config/message-handling.config';
import { EnhancedWebSocket } from './custom-ws-adapter';
import { CustomWebSocketAdapter } from './custom-ws-adapter';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { GlobalExceptionFilter } from '../../../common/filters';
import { WsThrottlerGuard } from '../../../common/guards';
import { LoggingInterceptor } from '../interceptors';
import { SubscriptionIdSchema } from '../schemas';
import { EventService } from '../services/event.service';
import { NostrRelayService } from '../services/nostr-relay.service';

@WebSocketGateway({
  path: '/',
  cors: true,
})
@UseInterceptors(LoggingInterceptor)
@UseFilters(GlobalExceptionFilter)
@UseGuards(WsThrottlerGuard)
export class NostrGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly messageHandlingConfig: MessageHandlingConfig;
  private readonly logger = new Logger(NostrGateway.name);

  constructor(
    private readonly eventService: EventService,
    private readonly nostrRelayService: NostrRelayService,
    configService: ConfigService<Config, true>,
  ) {
    this.messageHandlingConfig = configService.get('messageHandling', {
      infer: true,
    });
  }

  async handleConnection(client: EnhancedWebSocket, context: IncomingMessage) {
    try {
      // Wait for the IP to be set by the adapter (max 1 second)
      const maxAttempts = 10;
      let attempts = 0;
      
      while (!client._ip && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms each attempt
        attempts++;
      }

      const ip = client._ip || 'unknown';
      
      this.logger.debug(`New WebSocket connection from IP: ${ip} (waited ${attempts * 100}ms)`);
      this.nostrRelayService.handleConnection(client, ip);
    } catch (error) {
      this.logger.error('Error handling connection');
      this.logger.error(error);
      this.nostrRelayService.handleConnection(client, 'unknown');
    }
  }

  handleDisconnect(client: EnhancedWebSocket) {
    this.nostrRelayService.handleDisconnect(client);
  }

  @SubscribeMessage('DEFAULT')
  async handleMessage(
    @ConnectedSocket() client: EnhancedWebSocket,
    @MessageBody() data: Array<any>,
  ) {
    return await this.nostrRelayService.handleMessage(client, data);
  }

  @SubscribeMessage('TOP')
  async top(@MessageBody() msg: Array<any>) {
    if (!this.messageHandlingConfig.top) {
      return;
    }

    if (msg.length <= 2) return;

    try {
      const [, reqSubscriptionId, ...reqFilters] = msg;
      const subscriptionId =
        await SubscriptionIdSchema.parseAsync(reqSubscriptionId);
      const filters = await this.nostrRelayService.validateFilters(reqFilters);

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
