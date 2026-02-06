import { Injectable, UnauthorizedException } from '@nestjs/common';
import { defaultLocale, resolveLocale, t } from '../localization/i18n';
import { DbService } from '../db/db.service';

const ritualOrder = ['breath', 'water', 'step'];

@Injectable()
export class StateService {
  private readonly intervalMs: number;

  constructor(private readonly dbService: DbService) {
    this.intervalMs = Number(process.env.DAILY_TASK_INTERVAL_MS ?? 86_400_000);
  }

  private async resolveLogin(login?: string) {
    if (!login) {
      return 'guest';
    }
    const user = await this.dbService.getUser(login);
    return user ? login : 'guest';
  }

  async requireAuth(login?: string, password?: string) {
    if (!login || !password) {
      throw new UnauthorizedException();
    }
    const user = await this.dbService.verifyUser(login, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private async ensureDailyReset(login: string, locale: string) {
    await this.dbService.ensureUserData(login);
    const daily = await this.dbService.getDaily(login);
    if (!daily) {
      return;
    }
    const now = Date.now();
    const nextReset = new Date(daily.next_reset_at).getTime();
    if (now < nextReset) {
      return;
    }

    const nowDate = new Date();
    const nextResetDate = new Date(nowDate.getTime() + this.intervalMs);
    await this.dbService.resetRituals(login);
    await this.dbService.setDaily(login, nowDate.toISOString(), nextResetDate.toISOString());
    await this.dbService.clearTasks(login);

    await this.dbService.addLog(
      login,
      `daily-reset-${nowDate.toISOString()}`,
      t(resolveLocale(locale), 'logs.dailyReset.title'),
      t(resolveLocale(locale), 'logs.dailyReset.note.schedule'),
      nowDate.toISOString(),
    );
  }

  async getDailyStatus(login?: string) {
    const resolvedLogin = await this.resolveLogin(login);
    await this.ensureDailyReset(resolvedLogin, defaultLocale);
    const daily = await this.dbService.getDaily(resolvedLogin);
    const rituals = await this.dbService.getRituals(resolvedLogin);
    const completed = rituals.every((ritual) => ritual.status === 'done');
    const remainingMs = Math.max(new Date(daily.next_reset_at).getTime() - Date.now(), 0);
    return {
      completed,
      intervalMs: this.intervalMs,
      nextResetAt: daily.next_reset_at,
      remainingMs,
    };
  }

  async getRituals(login?: string, language?: string) {
    const resolvedLogin = await this.resolveLogin(login);
    const locale = resolveLocale(language);
    await this.ensureDailyReset(resolvedLogin, locale);
    const rituals = await this.dbService.getRituals(resolvedLogin);
    return rituals
      .sort(
        (a, b) => ritualOrder.indexOf(a.ritual_id) - ritualOrder.indexOf(b.ritual_id),
      )
      .map((ritual) => ({
        id: ritual.ritual_id,
        status: ritual.status,
        completedAt: ritual.completed_at ?? undefined,
        title: t(locale, `rituals.${ritual.ritual_id}.title`),
        detail: t(locale, `rituals.${ritual.ritual_id}.detail`),
        duration: t(locale, `rituals.${ritual.ritual_id}.duration`),
      }));
  }

  async completeRitual(login: string, language: string, ritualId: string) {
    await this.ensureDailyReset(login, language);
    const now = new Date().toISOString();
    const rituals = await this.dbService.getRituals(login);
    for (const ritual of rituals) {
      if (ritual.ritual_id === ritualId) {
        await this.dbService.updateRitual(login, ritual.ritual_id, 'done', now);
      } else if (ritual.status === 'active') {
        await this.dbService.updateRitual(login, ritual.ritual_id, 'idle');
      }
    }
    const updated = await this.dbService.getRituals(login);
    const next = updated.find((ritual) => ritual.status !== 'done');
    if (next) {
      await this.dbService.updateRitual(login, next.ritual_id, 'active');
    }
    return this.getRituals(login, language);
  }

  async startRitual(login: string, language: string) {
    await this.ensureDailyReset(login, language);
    const rituals = await this.dbService.getRituals(login);
    const next = rituals.find((ritual) => ritual.status !== 'done');
    if (!next) {
      return this.getRituals(login, language);
    }
    for (const ritual of rituals) {
      if (ritual.ritual_id === next.ritual_id) {
        await this.dbService.updateRitual(login, ritual.ritual_id, 'active');
      } else if (ritual.status !== 'done') {
        await this.dbService.updateRitual(login, ritual.ritual_id, 'idle');
      }
    }
    return this.getRituals(login, language);
  }

  async addLogEntry(login: string, title: string, note: string) {
    const createdAt = new Date().toISOString();
    const id = `${title}-${createdAt}`;
    await this.dbService.addLog(login, id, title, note, createdAt);
    return { id, title, note, createdAt };
  }

  async getLogs(login?: string) {
    const resolvedLogin = await this.resolveLogin(login);
    const logs = await this.dbService.getLogs(resolvedLogin);
    return logs.map((log) => ({
      id: log.id,
      title: log.title,
      note: log.note,
      createdAt: log.created_at,
    }));
  }

  async getMetrics(login?: string, language?: string) {
    const resolvedLogin = await this.resolveLogin(login);
    const locale = resolveLocale(language);
    await this.ensureDailyReset(resolvedLogin, locale);
    const rituals = await this.dbService.getRituals(resolvedLogin);
    const total = rituals.length;
    const completed = rituals.filter((ritual) => ritual.status === 'done').length;
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

  async authenticate(login: string, password: string, language?: string) {
    const locale = resolveLocale(language);
    const existing = await this.dbService.getUser(login);

    if (existing) {
      const success = existing.password === password;
      return {
        success,
        message: success ? t(locale, 'auth.welcomeBack') : t(locale, 'auth.invalidPassword'),
        ...(success
          ? {
              user: {
                login,
                createdAt: existing.created_at,
                language: existing.language ?? locale,
              },
            }
          : {}),
      };
    }

    const createdAt = new Date().toISOString();
    await this.dbService.ensureUser(login, password, locale);

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

  async updateUserLanguage(login: string, language: string) {
    const locale = resolveLocale(language);
    await this.dbService.updateUserLanguage(login, locale);
    const user = await this.dbService.getUser(login);
    if (!user) {
      return null;
    }
    return { login: user.login, createdAt: user.created_at, language: user.language };
  }

  async getUserLanguage(login?: string) {
    const resolvedLogin = await this.resolveLogin(login);
    const user = await this.dbService.getUser(resolvedLogin);
    return resolveLocale(user?.language);
  }

  async getTasks(login?: string) {
    const resolvedLogin = await this.resolveLogin(login);
    await this.dbService.ensureUserData(resolvedLogin);
    return this.dbService.getTasks(resolvedLogin);
  }

  async setTasks(login: string, tasks: { id: string; title: string; detail: string; createdAt: string }[]) {
    await this.dbService.setTasks(login, tasks);
  }

  async addTask(login: string, task: { id: string; title: string; detail: string; createdAt: string }) {
    await this.dbService.addTask(login, task);
  }

  async removeTask(login: string, taskId: string) {
    return this.dbService.removeTask(login, taskId);
  }

  async clearTasks(login: string) {
    await this.dbService.clearTasks(login);
  }
}
