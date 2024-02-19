import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EventRepository } from '../repositories';

@Injectable()
export class TaskService {
  constructor(
    @InjectPinoLogger(TaskService.name)
    private readonly logger: PinoLogger,
    private readonly eventRepository: EventRepository,
  ) {}

  @Interval(600000) // 10 minutes
  async deleteExpiredEvents() {
    const result = await this.eventRepository.deleteExpiredEvents();
    this.logger.info(`Deleted ${result.affected} expired events`);
  }
}
