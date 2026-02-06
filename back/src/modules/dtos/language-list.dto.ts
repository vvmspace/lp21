import { ApiProperty } from '@nestjs/swagger';

class LanguageItemDto {
  @ApiProperty({ example: 'ru' })
  language: string;

  @ApiProperty({ example: '🇷🇺' })
  icon: string;
}

export class LanguageListDto {
  @ApiProperty({ type: LanguageItemDto, isArray: true })
  languages: LanguageItemDto[];
}
