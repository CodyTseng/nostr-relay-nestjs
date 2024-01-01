import { WsAdapter } from '@nestjs/platform-ws';
import { MessageMappingProperties } from '@nestjs/websockets/gateway-metadata-explorer';
import { MessageType } from '@nostr-relay/common';
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

      const [type] = messageData;
      if (
        typeof type !== 'string' ||
        ![
          MessageType.EVENT,
          MessageType.REQ,
          MessageType.CLOSE,
          MessageType.AUTH,
          'TOP',
        ].includes(type)
      ) {
        return EMPTY;
      }

      const messageHandler = handlers.find((handler) =>
        type === 'TOP'
          ? handler.message === 'TOP'
          : handler.message === 'DEFAULT',
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
