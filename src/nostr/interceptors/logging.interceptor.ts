import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Observable, finalize } from 'rxjs';
import { Config } from 'src/config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly slowRequestThreshold: number;
  constructor(
    @InjectPinoLogger(LoggingInterceptor.name)
    private readonly logger: PinoLogger,
    configService: ConfigService<Config, true>,
  ) {
    this.slowRequestThreshold = configService.get('logger', {
      infer: true,
    }).slowRequestThreshold;
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
        if (executionTime < this.slowRequestThreshold) {
          this.logger.info({ data, executionTime });
        } else {
          this.logger.warn({ data, executionTime }, 'slow request');
        }
      }),
    );
  }
}
