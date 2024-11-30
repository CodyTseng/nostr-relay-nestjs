import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { get } from 'lodash';
import { Observable, finalize } from 'rxjs';
import { Config } from 'src/config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly slowExecutionThreshold: number;
  constructor(
    private readonly logger: any, // Replaced Pino logger with NestJS Logger
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

    return next.handle().pipe(
      finalize(() => {
        const executionTime = Date.now() - start;
        const msg = `${get(
          data,
          '0',
          'UNKNOWN',
        )} request took ${executionTime}ms to execute`;

        if (executionTime < this.slowExecutionThreshold) {
          this.logger.log({ data, executionTime }, msg);
        } else {
          this.logger.warn({ data, executionTime }, `${msg} (slow)`);
        }
      }),
    );
  }
}
