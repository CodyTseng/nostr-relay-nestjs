import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createOutgoingNoticeMessage } from '@nostr-relay/common';
import { Request, Response } from 'express';
import { WebSocket } from 'ws';
import { ClientException } from '../exceptions';

@Catch(Error)
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: Logger,
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
    client.send(JSON.stringify(createOutgoingNoticeMessage(error.message)));
  }

  private handleHttpException(error: Error, response: Response) {
    if (!(error instanceof HttpException)) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Internal Server Error!',
        error: 'Internal Error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }

    const status = error.getStatus();
    if (status >= 500 && status < 600) {
      return response.status(status).send({
        message: 'Internal Server Error!',
        error: 'Internal Error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }

    return response.status(status).send(error.getResponse());
  }
}
