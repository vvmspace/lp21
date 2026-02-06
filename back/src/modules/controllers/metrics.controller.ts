import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MetricDto } from '../dtos/metrics.dto';
import { StateService } from '../../libs/storage/state.service';

@ApiTags('Metrics')
@Controller('api/v1/metrics')
export class MetricsController {
  constructor(private readonly stateService: StateService) {}

  @Get()
  @ApiOkResponse({ type: MetricDto, isArray: true })
  getMetrics(): MetricDto[] {
    return this.stateService.getMetrics();
  }
}
