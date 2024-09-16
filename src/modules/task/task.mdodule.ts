import { Module } from '@nestjs/common';
import { MetricModule } from '../metric/metric.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { WotModule } from '../wot/wot.module';
import { TaskService } from './task.service';

@Module({
  imports: [RepositoriesModule, MetricModule, WotModule],
  providers: [TaskService],
})
export class TaskModule {}
