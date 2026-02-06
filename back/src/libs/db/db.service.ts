import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

const defaultRitualIds = ['breath', 'water', 'step'];

@Injectable()
export class DbService {
  private readonly pool: Pool;
  private readonly ready: Promise<void>;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST ?? 'db',
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USER ?? 'life_protocol',
      password: process.env.DB_PASSWORD ?? 'life_protocol',
      database: process.env.DB_NAME ?? 'life_protocol',
    });
    this.ready = this.initialize();
  }

  private async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        language TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS rituals (
        user_login TEXT NOT NULL REFERENCES users(login) ON DELETE CASCADE,
        ritual_id TEXT NOT NULL,
        status TEXT NOT NULL,
        completed_at TIMESTAMPTZ,
        PRIMARY KEY (user_login, ritual_id)
      );

      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        user_login TEXT NOT NULL REFERENCES users(login) ON DELETE CASCADE,
        title TEXT NOT NULL,
        note TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_login TEXT NOT NULL REFERENCES users(login) ON DELETE CASCADE,
        title TEXT NOT NULL,
        detail TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS daily (
        user_login TEXT PRIMARY KEY REFERENCES users(login) ON DELETE CASCADE,
        last_reset_at TIMESTAMPTZ NOT NULL,
        next_reset_at TIMESTAMPTZ NOT NULL
      );
    `);

    await this.ensureUser('guest', 'guest', 'ru');
  }

  private async ensureReady() {
    await this.ready;
  }

  async ensureUser(login: string, password: string, language: string) {
    await this.ensureReady();
    const existing = await this.pool.query('SELECT login FROM users WHERE login = $1', [login]);
    if (existing.rowCount === 0) {
      await this.pool.query(
        'INSERT INTO users (login, password, created_at, language) VALUES ($1, $2, $3, $4)',
        [login, password, new Date().toISOString(), language],
      );
    }
    await this.ensureUserData(login);
  }

  async ensureUserData(login: string) {
    await this.ensureReady();
    const ritualRows = await this.pool.query('SELECT ritual_id FROM rituals WHERE user_login = $1', [login]);
    const existingIds = new Set(ritualRows.rows.map((row) => row.ritual_id));
    const missing = defaultRitualIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      const values = missing
        .map((_, index) => `($1, $${index + 2}, 'idle')`)
        .join(', ');
      await this.pool.query(
        `INSERT INTO rituals (user_login, ritual_id, status) VALUES ${values}`,
        [login, ...missing],
      );
    }

    const daily = await this.pool.query('SELECT user_login FROM daily WHERE user_login = $1', [login]);
    if (daily.rowCount === 0) {
      const now = new Date();
      const nextReset = new Date(now.getTime() + Number(process.env.DAILY_TASK_INTERVAL_MS ?? 86_400_000));
      await this.pool.query(
        'INSERT INTO daily (user_login, last_reset_at, next_reset_at) VALUES ($1, $2, $3)',
        [login, now.toISOString(), nextReset.toISOString()],
      );
    }
  }

  async getUser(login: string) {
    await this.ensureReady();
    const result = await this.pool.query('SELECT * FROM users WHERE login = $1', [login]);
    return result.rows[0] ?? null;
  }

  async verifyUser(login: string, password: string) {
    const user = await this.getUser(login);
    if (!user) return null;
    if (user.password !== password) return null;
    return user;
  }

  async updateUserLanguage(login: string, language: string) {
    await this.ensureReady();
    await this.pool.query('UPDATE users SET language = $1 WHERE login = $2', [language, login]);
  }

  async getRituals(login: string) {
    await this.ensureReady();
    const result = await this.pool.query(
      'SELECT ritual_id, status, completed_at FROM rituals WHERE user_login = $1 ORDER BY ritual_id',
      [login],
    );
    return result.rows;
  }

  async updateRitual(login: string, ritualId: string, status: string, completedAt?: string | null) {
    await this.ensureReady();
    await this.pool.query(
      'UPDATE rituals SET status = $1, completed_at = $2 WHERE user_login = $3 AND ritual_id = $4',
      [status, completedAt ?? null, login, ritualId],
    );
  }

  async resetRituals(login: string) {
    await this.ensureReady();
    await this.pool.query(
      'UPDATE rituals SET status = $1, completed_at = NULL WHERE user_login = $2',
      ['idle', login],
    );
  }

  async getLogs(login: string) {
    await this.ensureReady();
    const result = await this.pool.query(
      'SELECT id, title, note, created_at FROM logs WHERE user_login = $1 ORDER BY created_at DESC',
      [login],
    );
    return result.rows;
  }

  async addLog(login: string, id: string, title: string, note: string, createdAt: string) {
    await this.ensureReady();
    await this.pool.query(
      'INSERT INTO logs (id, user_login, title, note, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, login, title, note, createdAt],
    );
  }

  async getTasks(login: string) {
    await this.ensureReady();
    const result = await this.pool.query(
      'SELECT id, title, detail, created_at FROM tasks WHERE user_login = $1 ORDER BY created_at DESC',
      [login],
    );
    return result.rows;
  }

  async setTasks(login: string, tasks: { id: string; title: string; detail: string; createdAt: string }[]) {
    await this.ensureReady();
    await this.pool.query('DELETE FROM tasks WHERE user_login = $1', [login]);
    for (const task of tasks) {
      await this.pool.query(
        'INSERT INTO tasks (id, user_login, title, detail, created_at) VALUES ($1, $2, $3, $4, $5)',
        [task.id, login, task.title, task.detail, task.createdAt],
      );
    }
  }

  async addTask(login: string, task: { id: string; title: string; detail: string; createdAt: string }) {
    await this.ensureReady();
    await this.pool.query(
      'INSERT INTO tasks (id, user_login, title, detail, created_at) VALUES ($1, $2, $3, $4, $5)',
      [task.id, login, task.title, task.detail, task.createdAt],
    );
  }

  async removeTask(login: string, taskId: string) {
    await this.ensureReady();
    const result = await this.pool.query(
      'DELETE FROM tasks WHERE user_login = $1 AND id = $2 RETURNING id',
      [login, taskId],
    );
    return result.rowCount > 0;
  }

  async clearTasks(login: string) {
    await this.ensureReady();
    await this.pool.query('DELETE FROM tasks WHERE user_login = $1', [login]);
  }

  async getDaily(login: string) {
    await this.ensureReady();
    const result = await this.pool.query('SELECT * FROM daily WHERE user_login = $1', [login]);
    return result.rows[0] ?? null;
  }

  async setDaily(login: string, lastResetAt: string, nextResetAt: string) {
    await this.ensureReady();
    await this.pool.query(
      'UPDATE daily SET last_reset_at = $1, next_reset_at = $2 WHERE user_login = $3',
      [lastResetAt, nextResetAt, login],
    );
  }
}
