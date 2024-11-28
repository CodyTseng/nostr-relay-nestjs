import { Request } from 'express';
import { IncomingMessage } from 'http';

export function getIpFromReq(req: Request | IncomingMessage): string | undefined {
  if (!req) return undefined;
  
  const headers = 'headers' in req ? req.headers : {};
  const xForwardedFor = headers['x-forwarded-for'];
  
  if (!xForwardedFor) {
    return req.socket?.remoteAddress;
  }
  
  if (Array.isArray(xForwardedFor)) {
    return xForwardedFor[0]?.trim();
  }
  
  return xForwardedFor.split(',')[0]?.trim();
}
