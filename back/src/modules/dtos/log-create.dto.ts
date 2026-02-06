import { ApiProperty } from '@nestjs/swagger';

export class LogCreateDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  note: string;
}
