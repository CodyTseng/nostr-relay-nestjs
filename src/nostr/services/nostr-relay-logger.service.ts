import { Injectable } from '@nestjs/common';
import { LogLevel, Logger } from '@nostr-relay/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class NostrRelayLogger implements Logger {
  private level: LogLevel = LogLevel.INFO;

  constructor(
    @InjectPinoLogger(NostrRelayLogger.name)
    private readonly logger: PinoLogger,
  ) {}

  setLogLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) this.logger.debug(message, ...args);
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) this.logger.info(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) this.logger.warn(message, ...args);
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) this.logger.error(message, ...args);
  }
}
