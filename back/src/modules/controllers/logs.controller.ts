import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LogEntryDto } from '../dtos/log-entry.dto';
import { LogCreateDto } from '../dtos/log-create.dto';
import { StateService } from '../../libs/storage/state.service';

@ApiTags('Logs')
@Controller('api/v1/logs')
export class LogsController {
  constructor(private readonly stateService: StateService) {}

  @Get()
  @ApiOkResponse({ type: LogEntryDto, isArray: true })
  getLogs(): LogEntryDto[] {
    return this.stateService.getLogs();
  }

  @Post()
  @ApiCreatedResponse({ type: LogEntryDto })
  addLog(@Body() body: LogCreateDto): LogEntryDto {
    return this.stateService.addLogEntry(body);
  }
}
