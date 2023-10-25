import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
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

    switch (host.getType()) {
      case 'ws':
        this.handleWsException(error, host.switchToWs().getClient<WebSocket>());
        break;
      case 'http':
        this.handleHttpException(
          error,
          host.switchToHttp().getResponse<Response>(),
        );
        break;
      default:
        break;
    }
  }

  private handleWsException(error: Error, client: WebSocket) {
    client.send(JSON.stringify(createNoticeResponse(error.message)));
  }

  private handleHttpException(error: Error, response: Response) {
    if (!(error instanceof HttpException)) {
      return response.status(500).send('Internal Server Error!');
    }

    const status = error.getStatus();
    if (status >= 500 && status < 600) {
      return response.status(status).send('Internal Server Error!');
    }

    return response.status(status).send(error.message);
  }
}
