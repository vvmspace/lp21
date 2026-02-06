import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RitualDto } from '../dtos/ritual.dto';
import { StateService } from '../../libs/storage/state.service';

@ApiTags('Rituals')
@Controller('api/v1/rituals')
export class RitualsController {
  constructor(private readonly stateService: StateService) {}

  @Get()
  @ApiOkResponse({ type: RitualDto, isArray: true })
  getRituals(@Query('lang') language?: string, @Query('login') login?: string): RitualDto[] {
    const resolved = language ?? this.stateService.getUserLanguage(login);
    return this.stateService.getRituals(resolved);
  }

  @Post('start')
  @ApiOkResponse({ type: RitualDto, isArray: true })
  startRitual(@Query('lang') language?: string, @Query('login') login?: string): RitualDto[] {
    const resolved = language ?? this.stateService.getUserLanguage(login);
    return this.stateService.startRitual(resolved);
  }

  @Post(':id/complete')
  @ApiOkResponse({ type: RitualDto, isArray: true })
  completeRitual(
    @Param('id') id: string,
    @Query('lang') language?: string,
    @Query('login') login?: string,
  ): RitualDto[] {
    const resolved = language ?? this.stateService.getUserLanguage(login);
    return this.stateService.completeRitual(id, resolved);
  }
}
