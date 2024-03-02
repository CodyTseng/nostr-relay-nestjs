import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EventRepository } from '../repositories';
import { MetricService } from './metric.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectPinoLogger(TaskService.name)
    private readonly logger: PinoLogger,
    private readonly eventRepository: EventRepository,
    private readonly metricService: MetricService,
  ) {}

  @Interval(600000) // 10 minutes
  async deleteExpiredEvents() {
    const result = await this.eventRepository.deleteExpiredEvents();
    this.logger.info(`Deleted ${result.affected} expired events`);
  }

  @Interval(3600000) // 1 hour
  async recordMetrics() {
    this.metricService.recordMetric();
  }
}
