import { Injectable } from '@nestjs/common';
import { loadState, saveState, type LogEntry, type Ritual, type State, type Task } from './state';
import { defaultLocale, resolveLocale, t, type Locale } from '../localization/i18n';

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

  getRituals(language?: string): (Ritual & { title: string; detail: string; duration: string })[] {
    this.checkDailyReset();
    const locale = resolveLocale(language);
    return this.state.rituals.map((ritual) => ({
      ...ritual,
      title: t(locale, `rituals.${ritual.id}.title`),
      detail: t(locale, `rituals.${ritual.id}.detail`),
      duration: t(locale, `rituals.${ritual.id}.duration`),
    }));
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

  completeRitual(
    id: string,
    language?: string,
  ): (Ritual & { title: string; detail: string; duration: string })[] {
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
    return this.getRituals(language);
  }

  startRitual(
    language?: string,
  ): (Ritual & { title: string; detail: string; duration: string })[] {
    this.checkDailyReset();
    const next = this.state.rituals.find((ritual) => ritual.status !== 'done');
    if (!next) {
      return this.state.rituals;
    }
    this.state.rituals = this.state.rituals.map((ritual) =>
      ritual.id === next.id ? { ...ritual, status: 'active' } : ritual.status === 'done' ? ritual : { ...ritual, status: 'idle' },
    );
    saveState(this.state);
    return this.getRituals(language);
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

  getMetrics(language?: string): { label: string; value: string }[] {
    this.checkDailyReset();
    const locale = resolveLocale(language);
    const total = this.state.rituals.length;
    const completed = this.state.rituals.filter((ritual) => ritual.status === 'done').length;
    const ratio = total === 0 ? 0 : completed / total;

    return [
      {
        label: t(locale, 'metrics.sleep.label'),
        value: ratio >= 0.66 ? t(locale, 'metrics.sleep.stable') : t(locale, 'metrics.sleep.support'),
      },
      {
        label: t(locale, 'metrics.noise.label'),
        value: ratio >= 0.33 ? t(locale, 'metrics.noise.down') : t(locale, 'metrics.noise.high'),
      },
      {
        label: t(locale, 'metrics.mode.label'),
        value: ratio >= 0.5 ? t(locale, 'metrics.mode.forming') : t(locale, 'metrics.mode.support'),
      },
    ];
  }

  authenticate(login: string, password: string, language?: string): {
    success: boolean;
    message: string;
    user: { login: string; createdAt: string; language: string };
  } {
    const locale = resolveLocale(language);
    const existing = this.state.users[login];

    if (existing) {
      const success = existing.password === password;
      return {
        success,
        message: success ? t(locale, 'auth.welcomeBack') : t(locale, 'auth.invalidPassword'),
        user: {
          login,
          createdAt: existing.createdAt,
          language: existing.language ?? locale,
        },
      };
    }

    const createdAt = new Date().toISOString();
    this.state.users[login] = { login, password, createdAt, language: locale };
    saveState(this.state);

    return {
      success: true,
      message: t(locale, 'auth.newUser'),
      user: {
        login,
        createdAt,
        language: locale,
      },
    };
  }

  updateUserLanguage(login: string, language: string): { login: string; createdAt: string; language: string } | null {
    const user = this.state.users[login];
    if (!user) {
      return null;
    }
    const locale = resolveLocale(language);
    this.state.users[login] = { ...user, language: locale };
    saveState(this.state);
    return { login: user.login, createdAt: user.createdAt, language: locale };
  }

  getUserLanguage(login?: string): Locale {
    if (!login) {
      return defaultLocale;
    }
    const user = this.state.users[login];
    if (!user) {
      return defaultLocale;
    }
    return resolveLocale(user.language);
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
    const locale = defaultLocale;
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
        title: t(locale, 'logs.dailyReset.title'),
        note:
          context === 'schedule'
            ? t(locale, 'logs.dailyReset.note.schedule')
            : context === 'catch-up'
              ? t(locale, 'logs.dailyReset.note.catchUp')
              : t(locale, 'logs.dailyReset.note.init'),
        createdAt: now.toISOString(),
      },
      ...this.state.logs,
    ];
    this.state.tasks = [];
    saveState(this.state);
  }
}
