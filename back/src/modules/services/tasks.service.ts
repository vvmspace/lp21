import { Injectable } from '@nestjs/common';
import { AIService } from '../ai/services/ai.service';
import { StateService } from '../../libs/storage/state.service';
import type { Task } from '../../libs/storage/state';

@Injectable()
export class TasksService {
  constructor(
    private readonly stateService: StateService,
    private readonly aiService: AIService,
  ) {}

  async getTasks(language?: string, login?: string): Promise<Task[]> {
    const existing = this.stateService.getTasks();
    if (existing.length > 0) {
      return existing;
    }
    return this.generateTasks(3, language, login);
  }

  async swipeTask(taskId: string, language?: string, login?: string): Promise<Task[]> {
    const removed = this.stateService.removeTask(taskId);
    if (!removed) {
      return this.stateService.getTasks();
    }
    const [replacement] = await this.generateTasks(1, language, login);
    if (replacement) {
      this.stateService.addTask(replacement);
    }
    return this.stateService.getTasks();
  }

  private async generateTasks(count: number, language?: string, login?: string): Promise<Task[]> {
    const progress = this.stateService.getProgressSummary();
    const resolvedLanguage = login ? this.stateService.getUserLanguage(login) : language;
    const suggestions = await this.aiService.generateTasks({
      count,
      language: resolvedLanguage,
      ritualsTotal: progress.ritualsTotal,
      ritualsCompleted: progress.ritualsCompleted,
      logsCount: progress.logsCount,
      completionRatio: progress.completionRatio,
    });

    const now = new Date().toISOString();
    const tasks = suggestions.slice(0, count).map((suggestion) => ({
      id: `${suggestion.title}-${now}-${Math.random().toString(16).slice(2)}`,
      title: suggestion.title,
      detail: suggestion.detail,
      createdAt: now,
    }));

    if (count > 1) {
      return this.stateService.setTasks(tasks);
    }

    tasks.forEach((task) => this.stateService.addTask(task));
    return this.stateService.getTasks();
  }
}
