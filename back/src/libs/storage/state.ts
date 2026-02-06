import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

export type RitualStatus = 'idle' | 'active' | 'done';

export type Ritual = {
  id: string;
  title: string;
  detail: string;
  duration: string;
  status: RitualStatus;
  completedAt?: string;
};

export type LogEntry = {
  id: string;
  title: string;
  note: string;
  createdAt: string;
};

export type User = {
  login: string;
  password: string;
  createdAt: string;
};

export type State = {
  users: Record<string, User>;
  rituals: Ritual[];
  logs: LogEntry[];
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
        title: 'Дыхание 4-4',
        detail: 'Сделай четыре мягких вдоха и выдоха. Мы не спешим.',
        duration: '2 минуты',
        status: 'idle',
      },
      {
        id: 'water',
        title: 'Вода + тепло',
        detail: 'Один стакан воды и тёплая пауза в теле.',
        duration: '3 минуты',
        status: 'idle',
      },
      {
        id: 'step',
        title: 'Мини-шаг',
        detail: 'Один микрошаг, который делает день устойчивее.',
        duration: '5 минут',
        status: 'idle',
      },
    ],
    logs: [],
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
    if (!parsed.daily) {
      const defaultState = createDefaultState(intervalMs);
      const merged: State = {
        ...parsed,
        daily: defaultState.daily,
      };
      writeFileSync(statePath, JSON.stringify(merged, null, 2), 'utf-8');
      return merged;
    }
    return parsed;
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
