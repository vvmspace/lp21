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
};

const defaultState: State = {
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
  if (!existsSync(statePath)) {
    writeFileSync(statePath, JSON.stringify(defaultState, null, 2), 'utf-8');
    return { ...defaultState };
  }
  const raw = readFileSync(statePath, 'utf-8');
  try {
    return JSON.parse(raw) as State;
  } catch {
    writeFileSync(statePath, JSON.stringify(defaultState, null, 2), 'utf-8');
    return { ...defaultState };
  }
};

export const saveState = (state: State): void => {
  ensureDir();
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
};
