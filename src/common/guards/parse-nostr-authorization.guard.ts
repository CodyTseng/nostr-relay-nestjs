import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventUtils } from '@nostr-relay/common';
import { Validator } from '@nostr-relay/validator';
import { Request } from 'express';
import { URL } from 'url';

@Injectable()
export class ParseNostrAuthorizationGuard implements CanActivate {
  private readonly validator = new Validator();
  private readonly hostname: string | undefined;

  constructor(configService: ConfigService) {
    this.hostname = configService.get('hostname');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.hostname) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    if (!authorization) {
      return true;
    }

    try {
      const [type, token] = authorization.split(' ');
      if (type !== 'Nostr') {
        return true;
      }
      const decoded = JSON.stringify(
        Buffer.from(token, 'base64').toString('utf-8'),
      );
      const event = await this.validator.validateEvent(JSON.parse(decoded));
      const validateErrorMsg = EventUtils.validate(event);
      if (validateErrorMsg) {
        return true;
      }

      if (Math.abs(event.created_at - Math.floor(Date.now() / 1000)) > 60) {
        return true;
      }

      if (event.kind !== 27235) {
        return true;
      }

      const uTagValue = event.tags.find(([tagName]) => tagName === 'u')?.[1];
      if (!uTagValue) {
        return true;
      }
      const url = new URL(uTagValue);
      if (url.hostname !== this.hostname || url.pathname !== request.url) {
        return true;
      }

      const methodTagValue = event.tags.find(
        ([tagName]) => tagName === 'method',
      )?.[1];
      if (
        !methodTagValue ||
        methodTagValue.toUpperCase() !== request.method.toUpperCase()
      ) {
        return true;
      }

      request.pubkey = event.pubkey;
    } catch {
      // do nothing
    }

    return true;
  }
}
