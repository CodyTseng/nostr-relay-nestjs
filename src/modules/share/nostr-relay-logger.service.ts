import { Injectable, Logger as NestLogger } from '@nestjs/common';
import { LogLevel, Logger } from '@nostr-relay/common';

@Injectable()
export class NostrRelayLogger implements Logger {
  private level: LogLevel = LogLevel.INFO;
  private readonly logger: NestLogger;

  constructor() {
    this.logger = new NestLogger(NostrRelayLogger.name);
  }

  setLogLevel(level: LogLevel): void {
    this.level = level;
  }

  getLogLevel(): LogLevel {
    return this.level;
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) this.logger.debug(message, ...args);
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) this.logger.log(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) this.logger.warn(message, ...args);
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) this.logger.error(message, ...args);
  }
}
