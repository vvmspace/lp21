import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

export type RitualStatus = 'idle' | 'active' | 'done';

export type Ritual = {
  id: string;
  status: RitualStatus;
  completedAt?: string;
};

export type LogEntry = {
  id: string;
  title: string;
  note: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
};

export type User = {
  login: string;
  password: string;
  createdAt: string;
  language: string;
};

export type State = {
  users: Record<string, User>;
  rituals: Ritual[];
  logs: LogEntry[];
  tasks: Task[];
  daily: {
    lastResetAt: string;
    nextResetAt: string;
  };
};

const createDefaultState = (intervalMs: number): State => {
  const now = new Date();
  const nextReset = new Date(now.getTime() + intervalMs);
  return {
    users: {},
    rituals: [
      {
        id: 'breath',
        status: 'idle',
      },
      {
        id: 'water',
        status: 'idle',
      },
      {
        id: 'step',
        status: 'idle',
      },
    ],
    logs: [],
    tasks: [],
    daily: {
      lastResetAt: now.toISOString(),
      nextResetAt: nextReset.toISOString(),
    },
  };
};

const statePath = process.env.STATE_PATH ?? '/app/data/state.json';

const ensureDir = () => {
  const dir = dirname(statePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

export const loadState = (): State => {
  ensureDir();
  const intervalMs = Number(process.env.DAILY_TASK_INTERVAL_MS ?? 86_400_000);
  if (!existsSync(statePath)) {
    const defaultState = createDefaultState(intervalMs);
    writeFileSync(statePath, JSON.stringify(defaultState, null, 2), 'utf-8');
    return { ...defaultState };
  }
  const raw = readFileSync(statePath, 'utf-8');
  try {
    const parsed = JSON.parse(raw) as State;
    const rituals = (parsed.rituals ?? []).map((ritual) => ({
      id: ritual.id,
      status: ritual.status,
      completedAt: ritual.completedAt,
    }));

    const users = Object.fromEntries(
      Object.entries(parsed.users ?? {}).map(([login, user]) => [
        login,
        {
          ...user,
          language: user.language ?? 'ru',
        },
      ]),
    );

    if (!parsed.daily || !parsed.tasks) {
      const defaultState = createDefaultState(intervalMs);
      const merged: State = {
        ...parsed,
        users,
        rituals,
        tasks: parsed.tasks ?? defaultState.tasks,
        daily: defaultState.daily,
      };
      writeFileSync(statePath, JSON.stringify(merged, null, 2), 'utf-8');
      return merged;
    }
    return {
      ...parsed,
      users,
      rituals,
    };
  } catch {
    const defaultState = createDefaultState(intervalMs);
    writeFileSync(statePath, JSON.stringify(defaultState, null, 2), 'utf-8');
    return { ...defaultState };
  }
};

export const saveState = (state: State): void => {
  ensureDir();
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
};
