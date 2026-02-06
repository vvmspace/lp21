import { Injectable } from '@nestjs/common';
import { HealthStatusDto } from '../dtos/health-status.dto';

@Injectable()
export class HealthService {
  getStatus(): HealthStatusDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
