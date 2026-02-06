import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { StateService } from '../../libs/storage/state.service';
import { DailyStatusDto } from '../dtos/daily-status.dto';

@ApiTags('daily')
@Controller('/api/v1/daily')
export class DailyController {
  constructor(private readonly stateService: StateService) {}

  @Get()
  @ApiOkResponse({ type: DailyStatusDto })
  getDailyStatus(): DailyStatusDto {
    return this.stateService.getDailyStatus();
  }
}
