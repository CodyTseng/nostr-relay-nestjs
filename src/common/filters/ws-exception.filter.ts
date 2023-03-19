import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { WebSocket } from 'ws';
import { createNoticeResponse } from '../../nostr/utils';

@Catch(Error)
export class WsExceptionFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    if (host.getType() === 'ws') {
      const wsHost = host.switchToWs();
      const client = wsHost.getClient<WebSocket>();
      client.send(JSON.stringify(createNoticeResponse(error.message)));
    }
  }
}
