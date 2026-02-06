import { Injectable } from '@nestjs/common';
import { AuthRequestDto } from '../dtos/auth-request.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { StateService } from '../../libs/storage/state.service';

@Injectable()
export class SessionService {
  constructor(private readonly stateService: StateService) {}

  authenticate(payload: AuthRequestDto): AuthResponseDto {
    return this.stateService.authenticate(payload.login, payload.password, payload.language);
  }

  updateLanguage(login: string, language: string) {
    return this.stateService.updateUserLanguage(login, language);
  }
}
