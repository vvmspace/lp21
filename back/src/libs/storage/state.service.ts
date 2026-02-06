import { Injectable } from '@nestjs/common';
import { loadState, saveState, type LogEntry, type Ritual, type State } from './state';

@Injectable()
export class StateService {
  private state: State;

  constructor() {
    this.state = loadState();
  }

  getRituals(): Ritual[] {
    return this.state.rituals;
  }

  completeRitual(id: string): Ritual[] {
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
    return this.state.logs;
  }

  getMetrics(): { label: string; value: string }[] {
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
}
