import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RitualDto } from '../dtos/ritual.dto';
import { StateService } from '../../libs/storage/state.service';

@ApiTags('Rituals')
@Controller('api/v1/rituals')
export class RitualsController {
  constructor(private readonly stateService: StateService) {}

  @Get()
  @ApiOkResponse({ type: RitualDto, isArray: true })
  getRituals(): RitualDto[] {
    return this.stateService.getRituals();
  }

  @Post('start')
  @ApiOkResponse({ type: RitualDto, isArray: true })
  startRitual(): RitualDto[] {
    return this.stateService.startRitual();
  }

  @Post(':id/complete')
  @ApiOkResponse({ type: RitualDto, isArray: true })
  completeRitual(@Param('id') id: string): RitualDto[] {
    return this.stateService.completeRitual(id);
  }
}
