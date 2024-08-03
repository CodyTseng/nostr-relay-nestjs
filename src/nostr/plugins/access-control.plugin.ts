import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientContext,
  HandleMessagePlugin,
  HandleMessageResult,
  IncomingMessage,
  MessageType,
} from '@nostr-relay/common';
import { Config } from 'src/config';

@Injectable()
export class AccessControlPlugin implements HandleMessagePlugin {
  private readonly blacklist: Set<string> | undefined;
  private readonly whitelist: Set<string> | undefined;

  constructor(config: ConfigService<Config, true>) {
    const limitConfig = config.get('limit', { infer: true });
    if (limitConfig.blacklist?.length) {
      this.blacklist = new Set(limitConfig.blacklist);
    }
    if (limitConfig.whitelist?.length) {
      this.whitelist = new Set(limitConfig.whitelist);
    }
  }

  async handleMessage(
    ctx: ClientContext,
    message: IncomingMessage,
    next: () => Promise<HandleMessageResult>,
  ): Promise<HandleMessageResult> {
    if (message[0] !== MessageType.EVENT) {
      return next();
    }

    const event = message[1];
    if (
      (this.blacklist && this.blacklist.has(event.pubkey)) ||
      (this.whitelist && !this.whitelist.has(event.pubkey))
    ) {
      const success = false;
      const message = 'blocked: you are banned from posting here';
      ctx.sendMessage([MessageType.OK, event.id, success, message]);
      return {
        messageType: MessageType.EVENT,
        success,
        message,
      };
    }

    return next();
  }
}
