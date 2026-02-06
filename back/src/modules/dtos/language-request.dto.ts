import { ApiProperty } from '@nestjs/swagger';

export class LanguageRequestDto {
  @ApiProperty({ example: 'ru' })
  language: string;
}
