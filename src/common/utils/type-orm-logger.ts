import { PinoLogger } from 'nestjs-pino';
import { Logger } from 'typeorm';

export class TypeOrmLogger implements Logger {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(TypeOrmLogger.name);
  }

  logQuery() {
    return;
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[] | undefined,
  ) {
    this.logger.error(
      { query, parameters },
      typeof error === 'string' ? error : error.message,
    );
  }

  logQuerySlow(time: number, query: string, parameters?: any[] | undefined) {
    this.logger.warn({ query, parameters, executionTime: time }, 'slow query');
  }

  logSchemaBuild(message: string) {
    this.logger.info('[schema build] %s', message);
  }

  logMigration(message: string) {
    this.logger.info('[migration] %s', message);
  }

  log(level: 'info' | 'warn' | 'log', message: any) {
    switch (level) {
      case 'warn':
        this.logger.warn(message);
        break;
      default:
        this.logger.info(message);
        break;
    }
  }
}
