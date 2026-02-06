import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TasksService } from '../services/tasks.service';
import { TaskDto } from '../dtos/task.dto';

@ApiTags('tasks')
@Controller('/api/v1/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOkResponse({ type: TaskDto, isArray: true })
  async getTasks(): Promise<TaskDto[]> {
    return this.tasksService.getTasks();
  }

  @Post(':id/swipe')
  @ApiOkResponse({ type: TaskDto, isArray: true })
  async swipeTask(@Param('id') id: string): Promise<TaskDto[]> {
    return this.tasksService.swipeTask(id);
  }
}
