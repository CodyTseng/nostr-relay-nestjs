import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { WebSocket } from 'ws';
import { createNoticeResponse } from '../../nostr/utils';

@Catch(Error)
export class WsExceptionFilter implements ExceptionFilter {
  constructor(@InjectPinoLogger() private readonly logger: PinoLogger) {}

  catch(error: Error, host: ArgumentsHost) {
    if (host.getType() === 'ws') {
      const wsHost = host.switchToWs();
      const client = wsHost.getClient<WebSocket>();
      client.send(JSON.stringify(createNoticeResponse(error.message)));
      this.logger.error(error);
    }
  }
}
