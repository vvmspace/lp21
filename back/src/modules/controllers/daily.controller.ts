import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DailyStatusDto } from '../dtos/daily-status.dto';
import { StateService } from '../../libs/storage/state.service';

@ApiTags('Daily')
@Controller('api/v1/daily')
export class DailyController {
  constructor(private readonly stateService: StateService) {}

  @Get()
  @ApiOkResponse({ type: DailyStatusDto })
  async getDailyStatus(@Query('login') login?: string): Promise<DailyStatusDto> {
    return this.stateService.getDailyStatus(login);
  }
}
