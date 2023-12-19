import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WsAdapter } from '@nestjs/platform-ws';
import { MessageMappingProperties } from '@nestjs/websockets/gateway-metadata-explorer';
import { createOutgoingNoticeMessage } from '@nostr-relay/core';
import { EMPTY, Observable } from 'rxjs';
import { Config } from 'src/config';
import { MessageHandlingConfig } from 'src/config/message-handling.config';
import { MessageEvent } from 'ws';

export class NostrWsAdapter extends WsAdapter {
  private readonly messageHandlingConfig: MessageHandlingConfig;

  constructor(app: INestApplication) {
    super(app);
    const config = app.get(ConfigService<Config, true>);
    this.messageHandlingConfig = config.get('messageHandling', { infer: true });
  }

  public bindMessageHandler(
    message: MessageEvent,
    handlers: MessageMappingProperties[],
    transform: (data: any) => Observable<any>,
  ): Observable<any> {
    try {
      const messageData = JSON.parse(message.data.toString());
      if (!Array.isArray(messageData)) {
        return transform(
          createOutgoingNoticeMessage('invalid: message must be a JSON array'),
        );
      }
      const [type] = messageData;

      const messageHandler = handlers.find(
        (handler) => handler.message === 'default',
      );
      if (!messageHandler) {
        return transform(
          createOutgoingNoticeMessage('invalid: unknown message type'),
        );
      }

      if (!this.messageHandlingConfig[type.toLowerCase()]) {
        return EMPTY;
      }

      return transform(messageHandler.callback(messageData));
    } catch (error) {
      return transform(
        createOutgoingNoticeMessage('error: ' + (error as Error).message),
      );
    }
  }
}
