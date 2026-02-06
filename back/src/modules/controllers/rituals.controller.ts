import { Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RitualDto } from '../dtos/ritual.dto';
import { StateService } from '../../libs/storage/state.service';

@ApiTags('Rituals')
@Controller('api/v1/rituals')
export class RitualsController {
  constructor(private readonly stateService: StateService) {}

  @Get()
  @ApiOkResponse({ type: RitualDto, isArray: true })
  async getRituals(
    @Query('lang') language?: string,
    @Query('login') login?: string,
  ): Promise<RitualDto[]> {
    return this.stateService.getRituals(login, language);
  }

  @Post('start')
  @ApiOkResponse({ type: RitualDto, isArray: true })
  async startRitual(
    @Query('lang') language?: string,
    @Headers('x-auth-login') login?: string,
    @Headers('x-auth-password') password?: string,
  ): Promise<RitualDto[]> {
    const user = await this.stateService.requireAuth(login, password);
    return this.stateService.startRitual(user.login, language ?? user.language);
  }

  @Post(':id/complete')
  @ApiOkResponse({ type: RitualDto, isArray: true })
  async completeRitual(
    @Param('id') id: string,
    @Query('lang') language?: string,
    @Headers('x-auth-login') login?: string,
    @Headers('x-auth-password') password?: string,
  ): Promise<RitualDto[]> {
    const user = await this.stateService.requireAuth(login, password);
    return this.stateService.completeRitual(user.login, language ?? user.language, id);
  }
}
