import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SessionService } from '../services/session.service';
import { AuthRequestDto } from '../dtos/auth-request.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { UpdateLanguageDto } from '../dtos/update-language.dto';
import { UserEntity } from '../entities/user.entity';

@ApiTags('Session')
@Controller('api/v1/session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('auth')
  @ApiCreatedResponse({ type: AuthResponseDto })
  authenticate(@Body() body: AuthRequestDto): AuthResponseDto {
    return this.sessionService.authenticate(body);
  }

  @Post('language')
  @ApiOkResponse({ type: UserEntity })
  updateLanguage(@Body() body: UpdateLanguageDto): UserEntity | null {
    return this.sessionService.updateLanguage(body.login, body.language);
  }
}
