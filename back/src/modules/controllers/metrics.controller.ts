import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MetricDto } from '../dtos/metrics.dto';
import { StateService } from '../../libs/storage/state.service';

@ApiTags('Metrics')
@Controller('api/v1/metrics')
export class MetricsController {
  constructor(private readonly stateService: StateService) {}

  @Get()
  @ApiOkResponse({ type: MetricDto, isArray: true })
  getMetrics(@Query('lang') language?: string, @Query('login') login?: string): MetricDto[] {
    const resolved = language ?? this.stateService.getUserLanguage(login);
    return this.stateService.getMetrics(resolved);
  }
}
