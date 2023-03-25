import { WsAdapter } from '@nestjs/platform-ws';
import { MessageMappingProperties } from '@nestjs/websockets/gateway-metadata-explorer';
import { Observable } from 'rxjs';
import { MessageEvent } from 'ws';
import { createNoticeResponse } from './utils';

export class NostrWsAdapter extends WsAdapter {
  public bindMessageHandler(
    message: MessageEvent,
    handlers: MessageMappingProperties[],
    transform: (data: any) => Observable<any>,
  ): Observable<any> {
    try {
      const messageData = JSON.parse(message.data.toString());
      if (!Array.isArray(messageData)) {
        return transform(
          createNoticeResponse('invalid: message must be a JSON array'),
        );
      }
      const [type, ...data] = messageData;
      const messageHandler = handlers.find(
        (handler) => handler.message === type,
      );
      if (!messageHandler) {
        return transform(createNoticeResponse('invalid: unknown message type'));
      }
      return transform(messageHandler.callback(data));
    } catch (error) {
      return transform(
        createNoticeResponse('error: ' + (error as Error).message),
      );
    }
  }
}
