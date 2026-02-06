import { ApiProperty } from '@nestjs/swagger';

export class TaskDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  detail: string;

  @ApiProperty({ example: '2026-02-06T18:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: 'task-id' })
  id: string;
}
