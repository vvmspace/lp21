import { Injectable } from '@nestjs/common';
import { AIService } from '../ai/services/ai.service';
import { StateService } from '../../libs/storage/state.service';
import { resolveLocale, t } from '../../libs/localization/i18n';

@Injectable()
export class TasksService {
  constructor(
    private readonly stateService: StateService,
    private readonly aiService: AIService,
  ) {}

  async getTasks(language?: string, login?: string) {
    if (!login) {
      return this.getMockTasks(language);
    }

    const effectiveLogin = login;
    const userLanguage = await this.stateService.getUserLanguage(login);
    const effectiveLanguage = language ?? userLanguage;
    const existing = await this.stateService.getTasks(effectiveLogin);
    if (existing.length > 0) {
      const intervalMs = Number(process.env.DAILY_TASK_INTERVAL_MS ?? 86_400_000);
      const oldest = existing.reduce((min, task) => {
        const createdAt = new Date(task.created_at).getTime();
        return Number.isNaN(createdAt) ? min : Math.min(min, createdAt);
      }, Number.POSITIVE_INFINITY);
      if (oldest !== Number.POSITIVE_INFINITY && Date.now() - oldest > intervalMs) {
        await this.stateService.clearTasks(effectiveLogin);
      } else {
        return existing;
      }
    }
    return this.generateTasks(3, effectiveLanguage, effectiveLogin);
  }

  async swipeTask(taskId: string, language?: string, login?: string) {
    const resolvedLogin = login ?? 'guest';
    const removed = await this.stateService.removeTask(resolvedLogin, taskId);
    if (!removed) {
      return this.stateService.getTasks(resolvedLogin);
    }
    const [replacement] = await this.generateTasks(1, language, resolvedLogin);
    if (replacement) {
      await this.stateService.addTask(resolvedLogin, replacement);
    }
    return this.stateService.getTasks(resolvedLogin);
  }

  private getMockTasks(language?: string) {
    const locale = resolveLocale(language);
    const now = new Date().toISOString();
    return [
      {
        id: `mock-task-breath-${now}`,
        title: t(locale, 'tasksMock.breath.title'),
        detail: t(locale, 'tasksMock.breath.detail'),
        createdAt: now,
      },
      {
        id: `mock-task-heat-${now}`,
        title: t(locale, 'tasksMock.heat.title'),
        detail: t(locale, 'tasksMock.heat.detail'),
        createdAt: now,
      },
      {
        id: `mock-task-choice-${now}`,
        title: t(locale, 'tasksMock.choice.title'),
        detail: t(locale, 'tasksMock.choice.detail'),
        createdAt: now,
      },
    ];
  }

  private async generateTasks(count: number, language?: string, login?: string) {
    const summary = await this.stateService.getRituals(login, language);
    const logs = await this.stateService.getLogs(login);
    const completed = summary.filter((ritual) => ritual.status === 'done').length;
    const total = summary.length;
    const completionRatio = total === 0 ? 0 : completed / total;

    const suggestions = await this.aiService.generateTasks({
      count,
      language,
      ritualsTotal: total,
      ritualsCompleted: completed,
      logsCount: logs.length,
      completionRatio,
    });

    const now = new Date().toISOString();
    const tasks = suggestions.slice(0, count).map((suggestion) => ({
      id: `${suggestion.title}-${now}-${Math.random().toString(16).slice(2)}`,
      title: suggestion.title,
      detail: suggestion.detail,
      createdAt: now,
    }));

    if (!login) {
      return tasks;
    }

    if (count > 1) {
      await this.stateService.setTasks(login, tasks);
      return this.stateService.getTasks(login);
    }

    for (const task of tasks) {
      await this.stateService.addTask(login, task);
    }
    return this.stateService.getTasks(login);
  }
}
