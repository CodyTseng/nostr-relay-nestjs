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
      // Extract IP from headers directly
      let ip = 'unknown';
      
      // Access headers from the client's _request property if context is undefined
      const headers = context?.headers || client._request?.headers;
      
      if (headers) {
        if (headers['x-real-ip']) {
          ip = Array.isArray(headers['x-real-ip'])
            ? headers['x-real-ip'][0]
            : headers['x-real-ip'];
        } else if (headers['x-forwarded-for']) {
          const forwarded = headers['x-forwarded-for'];
          ip = Array.isArray(forwarded)
            ? forwarded[0].split(',')[0].trim()
            : forwarded.split(',')[0].trim();
        }
      }
      
      // Fallback to socket remote address
      if (ip === 'unknown' && client._request?.socket?.remoteAddress) {
        ip = client._request.socket.remoteAddress;
      }

      // Store the IP on the client for future use
      client._ip = ip;

      this.logger.debug('Connection established:', {
        headers: headers,
        remoteAddress: client._request?.socket?.remoteAddress,
        extractedIp: ip
      });

      this.logger.debug(`New WebSocket connection from IP: ${ip}`);
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
