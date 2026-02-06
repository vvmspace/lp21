import { ApiProperty } from '@nestjs/swagger';

export class MetricDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string;
}
