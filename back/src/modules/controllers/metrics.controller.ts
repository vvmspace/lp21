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
  async getMetrics(
    @Query('lang') language?: string,
    @Query('login') login?: string,
  ): Promise<MetricDto[]> {
    return this.stateService.getMetrics(login, language);
  }
}
