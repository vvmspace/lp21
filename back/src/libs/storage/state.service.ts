import { Injectable } from '@nestjs/common';
import { loadState, saveState, type LogEntry, type Ritual, type State, type Task } from './state';

@Injectable()
export class StateService {
  private state: State;
  private readonly intervalMs: number;
  private readonly checkTimer: NodeJS.Timeout;

  constructor() {
    this.intervalMs = Number(process.env.DAILY_TASK_INTERVAL_MS ?? 86_400_000);
    this.state = loadState();
    this.ensureDailySchedule();
    this.checkTimer = setInterval(() => {
      this.checkDailyReset();
    }, 1000);
  }

  getDailyStatus(): {
    completed: boolean;
    intervalMs: number;
    nextResetAt: string;
    remainingMs: number;
  } {
    this.checkDailyReset();
    const now = Date.now();
    const nextReset = new Date(this.state.daily.nextResetAt).getTime();
    const remainingMs = Math.max(nextReset - now, 0);
    const completed = this.state.rituals.every((ritual) => ritual.status === 'done');

    return {
      completed,
      intervalMs: this.intervalMs,
      nextResetAt: this.state.daily.nextResetAt,
      remainingMs,
    };
  }

  getRituals(): Ritual[] {
    this.checkDailyReset();
    return this.state.rituals;
  }

  getTasks(): Task[] {
    this.checkDailyReset();
    return this.state.tasks;
  }

  setTasks(tasks: Task[]): Task[] {
    this.state.tasks = tasks;
    saveState(this.state);
    return this.state.tasks;
  }

  addTask(task: Task): Task {
    this.state.tasks = [task, ...this.state.tasks];
    saveState(this.state);
    return task;
  }

  removeTask(taskId: string): Task | null {
    const index = this.state.tasks.findIndex((task) => task.id === taskId);
    if (index === -1) {
      return null;
    }
    const [removed] = this.state.tasks.splice(index, 1);
    saveState(this.state);
    return removed;
  }

  getProgressSummary(): {
    ritualsTotal: number;
    ritualsCompleted: number;
    logsCount: number;
    completionRatio: number;
  } {
    const ritualsTotal = this.state.rituals.length;
    const ritualsCompleted = this.state.rituals.filter((ritual) => ritual.status === 'done').length;
    const logsCount = this.state.logs.length;
    const completionRatio = ritualsTotal === 0 ? 0 : ritualsCompleted / ritualsTotal;
    return { ritualsTotal, ritualsCompleted, logsCount, completionRatio };
  }

  completeRitual(id: string): Ritual[] {
    this.checkDailyReset();
    const now = new Date().toISOString();
    this.state.rituals = this.state.rituals.map((ritual) =>
      ritual.id === id
        ? { ...ritual, status: 'done', completedAt: now }
        : ritual.status === 'active'
          ? { ...ritual, status: 'idle' }
          : ritual,
    );

    const next = this.state.rituals.find((ritual) => ritual.status !== 'done');
    if (next) {
      this.state.rituals = this.state.rituals.map((ritual) =>
        ritual.id === next.id && ritual.status !== 'done' ? { ...ritual, status: 'active' } : ritual,
      );
    }

    saveState(this.state);
    return this.state.rituals;
  }

  startRitual(): Ritual[] {
    this.checkDailyReset();
    const next = this.state.rituals.find((ritual) => ritual.status !== 'done');
    if (!next) {
      return this.state.rituals;
    }
    this.state.rituals = this.state.rituals.map((ritual) =>
      ritual.id === next.id ? { ...ritual, status: 'active' } : ritual.status === 'done' ? ritual : { ...ritual, status: 'idle' },
    );
    saveState(this.state);
    return this.state.rituals;
  }

  addLogEntry(entry: Omit<LogEntry, 'id' | 'createdAt'>): LogEntry {
    this.checkDailyReset();
    const createdAt = new Date().toISOString();
    const log: LogEntry = {
      id: `${entry.title}-${createdAt}`,
      createdAt,
      ...entry,
    };
    this.state.logs = [log, ...this.state.logs];
    saveState(this.state);
    return log;
  }

  getLogs(): LogEntry[] {
    this.checkDailyReset();
    return this.state.logs;
  }

  getMetrics(): { label: string; value: string }[] {
    this.checkDailyReset();
    const total = this.state.rituals.length;
    const completed = this.state.rituals.filter((ritual) => ritual.status === 'done').length;
    const ratio = total === 0 ? 0 : completed / total;

    return [
      {
        label: 'Сон',
        value: ratio >= 0.66 ? 'Стабильный' : 'Нужна поддержка',
      },
      {
        label: 'Внутренний шум',
        value: ratio >= 0.33 ? 'Снижается' : 'Сильный',
      },
      {
        label: 'Режим',
        value: ratio >= 0.5 ? 'Формируется' : 'Требует опоры',
      },
    ];
  }

  authenticate(login: string, password: string): {
    success: boolean;
    message: string;
    user: { login: string; createdAt: string };
  } {
    const existing = this.state.users[login];

    if (existing) {
      const success = existing.password === password;
      return {
        success,
        message: success ? 'Добро пожаловать обратно.' : 'Неверный пароль.',
        user: {
          login,
          createdAt: existing.createdAt,
        },
      };
    }

    const createdAt = new Date().toISOString();
    this.state.users[login] = { login, password, createdAt };
    saveState(this.state);

    return {
      success: true,
      message: 'Новый пользователь создан.',
      user: {
        login,
        createdAt,
      },
    };
  }

  private ensureDailySchedule(): void {
    const nextReset = new Date(this.state.daily.nextResetAt).getTime();
    if (Number.isNaN(nextReset)) {
      this.resetDaily('init');
      return;
    }

    if (Date.now() >= nextReset) {
      this.resetDaily('catch-up');
    }
  }

  private checkDailyReset(): void {
    const nextReset = new Date(this.state.daily.nextResetAt).getTime();
    if (Date.now() >= nextReset) {
      this.resetDaily('schedule');
    }
  }

  private resetDaily(context: 'init' | 'catch-up' | 'schedule'): void {
    const now = new Date();
    const nextReset = new Date(now.getTime() + this.intervalMs);
    this.state.rituals = this.state.rituals.map((ritual) => ({
      ...ritual,
      status: 'idle',
      completedAt: undefined,
    }));
    this.state.daily = {
      lastResetAt: now.toISOString(),
      nextResetAt: nextReset.toISOString(),
    };
    this.state.logs = [
      {
        id: `daily-reset-${now.toISOString()}`,
        title: 'Новый цикл',
        note:
          context === 'schedule'
            ? 'Ежедневные рамки обновлены автоматически.'
            : 'Рамки синхронизированы при запуске.',
        createdAt: now.toISOString(),
      },
      ...this.state.logs,
    ];
    this.state.tasks = [];
    saveState(this.state);
  }
}
