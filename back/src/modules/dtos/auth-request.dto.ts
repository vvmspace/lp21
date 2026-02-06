import { ApiProperty } from '@nestjs/swagger';

export class AuthRequestDto {
  @ApiProperty({ example: 'alex' })
  login: string;

  @ApiProperty({ example: 'supersecret' })
  password: string;

  @ApiProperty({ example: 'ru', required: false })
  language?: string;
}
