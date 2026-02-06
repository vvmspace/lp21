import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LanguageListDto } from '../dtos/language-list.dto';
import { LanguageRequestDto } from '../dtos/language-request.dto';
import { LanguageService } from '../../libs/localization/language.service';
import { StateService } from '../../libs/storage/state.service';
import { UserEntity } from '../entities/user.entity';

@ApiTags('Language')
@Controller('api/v1/language')
export class LanguageController {
  constructor(
    private readonly languageService: LanguageService,
    private readonly stateService: StateService,
  ) {}

  @Get()
  @ApiOkResponse({ type: LanguageListDto })
  getLanguages(): LanguageListDto {
    return { languages: this.languageService.getLanguages() };
  }

  @Post()
  @ApiOkResponse({ type: UserEntity })
  async updateLanguage(
    @Body() body: LanguageRequestDto,
    @Headers('x-auth-login') login?: string,
    @Headers('x-auth-password') password?: string,
  ): Promise<UserEntity | null> {
    const user = await this.stateService.requireAuth(login, password);
    return this.stateService.updateUserLanguage(user.login, body.language);
  }
}
