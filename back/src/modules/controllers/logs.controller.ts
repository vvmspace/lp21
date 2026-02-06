import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
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
  async getLogs(@Headers('x-auth-login') login?: string): Promise<LogEntryDto[]> {
    return this.stateService.getLogs(login);
  }

  @Post()
  @ApiCreatedResponse({ type: LogEntryDto })
  async addLog(
    @Body() body: LogCreateDto,
    @Headers('x-auth-login') login?: string,
    @Headers('x-auth-password') password?: string,
  ): Promise<LogEntryDto> {
    const user = await this.stateService.requireAuth(login, password);
    return this.stateService.addLogEntry(user.login, body.title, body.note);
  }
}
