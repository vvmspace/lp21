import { ApiProperty } from '@nestjs/swagger';

export class LogEntryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  note: string;

  @ApiProperty()
  createdAt: string;
}
