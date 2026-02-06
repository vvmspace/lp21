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

export type Metric = {
  label: string;
  value: string;
};

export type Task = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
};

export type DailyStatus = {
  completed: boolean;
  intervalMs: number;
  nextResetAt: string;
  remainingMs: number;
};
