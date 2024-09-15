import { Module } from '@nestjs/common';
import { MetricModule } from '../metric/metric.module';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [RepositoriesModule, MetricModule],
})
export class TaskModule {}
