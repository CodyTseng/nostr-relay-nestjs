import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { get } from 'lodash';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Observable, finalize } from 'rxjs';
import { Config } from 'src/config';
import { WebSocket } from 'ws';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly slowExecutionThreshold: number;
  constructor(
    @InjectPinoLogger(LoggingInterceptor.name)
    private readonly logger: PinoLogger,
    configService: ConfigService<Config, true>,
  ) {
    this.slowExecutionThreshold = configService.get('logger', {
      infer: true,
    }).slowExecutionThreshold;
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    if (context.getType() !== 'ws') return next.handle();

    const start = Date.now();
    const data = context.switchToWs().getData();
    const client = context.switchToWs().getClient<WebSocket>();

    return next.handle().pipe(
      finalize(() => {
        const executionTime = Date.now() - start;
        const msg = `${get(
          data,
          '0',
          'UNKNOWN',
        )} request took ${executionTime}ms to execute`;

        if (executionTime < this.slowExecutionThreshold) {
          this.logger.info({ data, executionTime, ip: client.ip }, msg);
        } else {
          this.logger.warn(
            { data, executionTime, ip: client.ip },
            `${msg} (slow)`,
          );
        }
      }),
    );
  }
}
