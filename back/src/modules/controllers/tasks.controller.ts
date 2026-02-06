import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TasksService } from '../services/tasks.service';
import { TaskDto } from '../dtos/task.dto';

@ApiTags('tasks')
@Controller('/api/v1/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOkResponse({ type: TaskDto, isArray: true })
  async getTasks(
    @Query('lang') language?: string,
    @Query('login') login?: string,
  ): Promise<TaskDto[]> {
    return this.tasksService.getTasks(language, login);
  }

  @Post(':id/swipe')
  @ApiOkResponse({ type: TaskDto, isArray: true })
  async swipeTask(
    @Param('id') id: string,
    @Query('lang') language?: string,
    @Query('login') login?: string,
  ): Promise<TaskDto[]> {
    return this.tasksService.swipeTask(id, language, login);
  }
}
