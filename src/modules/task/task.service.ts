import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { MetricService } from '../metric/metric.service';
import { EventRepository } from '../repositories/event.repository';
import { WotService } from '../wot/wot.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly logger: Logger,
    private readonly eventRepository: EventRepository,
    private readonly metricService: MetricService,
    private readonly wotService: WotService,
  ) {}

  @Interval(600000) // 10 minutes
  async deleteExpiredEvents() {
    const affected = await this.eventRepository.deleteExpiredEvents();
    this.logger.log(`Deleted ${affected} expired events`);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async recordMetrics() {
    this.metricService.recordMetric();
    this.logger.log('Recorded metrics');
  }
}
