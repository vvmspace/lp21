import { ApiProperty } from '@nestjs/swagger';

export class UpdateLanguageDto {
  @ApiProperty({ example: 'alex' })
  login: string;

  @ApiProperty({ example: 'en' })
  language: string;
}
