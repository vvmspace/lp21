import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from '../services/health.service';
import { HealthStatusDto } from '../dtos/health-status.dto';

@ApiTags('Health')
@Controller('api/v1/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({ type: HealthStatusDto })
  getStatus(): HealthStatusDto {
    return this.healthService.getStatus();
  }
}
