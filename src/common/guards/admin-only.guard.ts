import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Config } from 'src/config';

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  private readonly adminPubkey: string | undefined;

  constructor(config: ConfigService<Config, true>) {
    const relayInfo = config.get('relayInfo', { infer: true });
    this.adminPubkey = relayInfo.pubkey;
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.adminPubkey) {
      return false;
    }
    const request = context.switchToHttp().getRequest<Request>();
    return request.pubkey === this.adminPubkey;
  }
}
