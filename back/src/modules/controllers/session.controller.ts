import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { SessionService } from '../services/session.service';
import { AuthRequestDto } from '../dtos/auth-request.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';

@ApiTags('Session')
@Controller('api/v1/session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('auth')
  @ApiCreatedResponse({ type: AuthResponseDto })
  async authenticate(@Body() body: AuthRequestDto): Promise<AuthResponseDto> {
    return this.sessionService.authenticate(body);
  }
}
