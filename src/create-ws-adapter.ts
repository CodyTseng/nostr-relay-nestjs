import { INestApplication } from '@nestjs/common';
import { MessageType } from '@nostr-relay/common';
import { WsAdapter } from 'another-nestjs-ws-adapter';

export function createWsAdapter(app: INestApplication) {
  const adapter = new WsAdapter(app);
  adapter.setMessagePreprocessor((message: any) => {
    if (!Array.isArray(message) || message.length < 1) {
      return;
    }

    const [type] = message;
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
      return;
    }

    return {
      event: type === 'TOP' ? 'TOP' : 'DEFAULT',
      data: message,
    };
  });

  return adapter;
}
