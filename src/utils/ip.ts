import { Request } from 'express';

export function getIpFromReq(req: Request): string | undefined {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (!xForwardedFor) {
    return req.socket.remoteAddress;
  }
  if (Array.isArray(xForwardedFor)) {
    return xForwardedFor[0].trim();
  }
  return xForwardedFor.split(',')[0].trim();
}
