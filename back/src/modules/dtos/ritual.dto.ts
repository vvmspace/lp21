import { ApiProperty } from '@nestjs/swagger';

export class RitualDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  detail: string;

  @ApiProperty()
  duration: string;

  @ApiProperty({ enum: ['idle', 'active', 'done'] })
  status: 'idle' | 'active' | 'done';

  @ApiProperty({ required: false })
  completedAt?: string;
}
