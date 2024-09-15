import { Controller, Get, Header, Render } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { MetricService } from './metric.service';

@Controller()
@ApiExcludeController()
export class MetricController {
  constructor(private readonly metricService: MetricService) {}

  @Get('metrics')
  @Render('metrics')
  @Header(
    'Content-Security-Policy',
    "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'",
  )
  metrics() {
    return this.metricService.getMetrics();
  }
}
