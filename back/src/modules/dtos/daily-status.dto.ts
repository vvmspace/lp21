import { ApiProperty } from '@nestjs/swagger';

export class DailyStatusDto {
  @ApiProperty({ example: true })
  completed: boolean;

  @ApiProperty({ example: 86400000 })
  intervalMs: number;

  @ApiProperty({ example: '2026-02-06T18:00:00.000Z' })
  nextResetAt: string;

  @ApiProperty({ example: 3600000 })
  remainingMs: number;
}
