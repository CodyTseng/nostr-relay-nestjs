import { WsAdapter } from '@nestjs/platform-ws';
import { MessageMappingProperties } from '@nestjs/websockets/gateway-metadata-explorer';
import { createOutgoingNoticeMessage } from '@nostr-relay/core';
import { EMPTY, Observable } from 'rxjs';
import { MessageEvent } from 'ws';

export class NostrWsAdapter extends WsAdapter {
  public bindMessageHandler(
    message: MessageEvent,
    handlers: MessageMappingProperties[],
    transform: (data: any) => Observable<any>,
  ): Observable<any> {
    try {
      const messageData = JSON.parse(message.data.toString());
      if (!Array.isArray(messageData) || messageData.length < 1) {
        return transform(
          createOutgoingNoticeMessage(
            'invalid: message must be a JSON array and must have at least one element',
          ),
        );
      }

      const messageHandler = handlers.find(
        (handler) => handler.message === 'default',
      );
      if (!messageHandler) {
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
