import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { WebSocket } from 'ws';
import { createNoticeResponse } from '../../nostr/utils';
import { ClientException } from '../exceptions';
import { Response } from 'express';

@Catch(Error)
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(GlobalExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(error: Error, host: ArgumentsHost) {
    // skip logging ClientException & NotFoundException
    if (
      !(error instanceof ClientException || error instanceof NotFoundException)
    ) {
      this.logger.error(error);
    }

    if (host.getType() === 'ws') {
      const wsHost = host.switchToWs();
      const client = wsHost.getClient<WebSocket>();
      client.send(JSON.stringify(createNoticeResponse(error.message)));
    } else if (host.getType() === 'http') {
      const response = host.switchToHttp().getResponse<Response>();
      response.status(500).send(`Internal Server Error: ${error.message}`);
    }
  }
}
