'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';

type RitualStatus = 'idle' | 'active' | 'done';

type Ritual = {
  id: string;
  title: string;
  detail: string;
  duration: string;
  status: RitualStatus;
  completedAt?: string;
};

type LogEntry = {
  id: string;
  title: string;
  note: string;
  timestamp: string;
};

const initialRituals: Ritual[] = [
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
];

const metrics = [
  { label: 'Сон', value: 'Стабильный' },
  { label: 'Внутренний шум', value: 'Снижается' },
  { label: 'Режим', value: 'Формируется' },
];

const modeSteps = [
  {
    title: 'Утро без давления',
    detail: '3 минуты тишины, чтобы система поняла: ты на связи.',
  },
  {
    title: 'День под рамками',
    detail: 'Одна фиксация тела и один микрошаг в реальности.',
  },
  {
    title: 'Вечер как закрытие',
    detail: 'Короткая проверка состояния без оценок.',
  },
];

const apiUrl = '/api';

export default function HomePage() {
  const ritualsRef = useRef<HTMLDivElement | null>(null);
  const authRef = useRef<HTMLDivElement | null>(null);
  const [rituals, setRituals] = useState<Ritual[]>(initialRituals);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('Нажми на любой ритуал, чтобы зафиксировать шаг.');
  const [modeOpen, setModeOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({ login: '', password: '' });
  const [authResult, setAuthResult] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const progress = useMemo(() => {
    const total = rituals.length;
    const completed = rituals.filter((ritual) => ritual.status === 'done').length;
    return { total, completed, percent: Math.round((completed / total) * 100) };
  }, [rituals]);

  const focusRitual = rituals.find((ritual) => ritual.id === focusId) ?? null;

  const addLogEntry = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setLogEntries((prev) => [
      {
        id: `${entry.title}-${now.getTime()}`,
        timestamp,
        ...entry,
      },
      ...prev,
    ]);
  };

  const handleStartRitual = () => {
    const next = rituals.find((ritual) => ritual.status !== 'done') ?? rituals[0];
    setRituals((prev) =>
      prev.map((ritual) => ({
        ...ritual,
        status: ritual.id === next.id ? 'active' : ritual.status === 'done' ? 'done' : 'idle',
      })),
    );
    setFocusId(next.id);
    setFeedback(`Старт мягкой сессии. Сейчас фокус: ${next.title}.`);
    addLogEntry({
      title: 'Сессия началась',
      note: `Фокус: ${next.title}.`,
    });
    ritualsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCompleteRitual = (ritualId: string) => {
    const completedRitual = rituals.find((ritual) => ritual.id === ritualId);
    if (!completedRitual) return;

    setRituals((prev) =>
      prev.map((ritual) =>
        ritual.id === ritualId
          ? { ...ritual, status: 'done', completedAt: new Date().toISOString() }
          : ritual,
      ),
    );
    addLogEntry({
      title: `Отмечено: ${completedRitual.title}`,
      note: 'Рамки удержаны без давления.',
    });
    setFeedback(`Зафиксировано: ${completedRitual.title}. ${progress.completed + 1}/${progress.total}.`);

    const remaining = rituals.filter((ritual) => ritual.id !== ritualId && ritual.status !== 'done');
    if (remaining.length > 0) {
      const next = remaining[0];
      setFocusId(next.id);
      setRituals((prev) =>
        prev.map((ritual) =>
          ritual.id === next.id && ritual.status !== 'done' ? { ...ritual, status: 'active' } : ritual,
        ),
      );
    } else {
      setFocusId(null);
      setFeedback('Все ритуалы выполнены. Можно закрепить состояние и отдыхать.');
      addLogEntry({
        title: 'Сессия закрыта',
        note: 'Ритм удержан. Отмечаем спокойствие.',
      });
    }
  };

  const handleToggleMode = () => {
    setModeOpen((prev) => !prev);
    addLogEntry({
      title: 'Режим раскрыт',
      note: 'План дня показан без давления.',
    });
  };

  const handleAuthOpen = () => {
    setAuthOpen(true);
    setAuthResult(null);
    setAuthError(null);
    authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthResult(null);
    setAuthError(null);

    try {
      const response = await fetch(`${apiUrl}/api/v1/session/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authForm),
      });

      if (!response.ok) {
        throw new Error('Сервер временно недоступен.');
      }

      const data: { success: boolean; message: string; user?: { login: string; createdAt: string } } =
        await response.json();

      setAuthResult(`${data.message} Пользователь: ${data.user?.login ?? authForm.login}.`);
      addLogEntry({
        title: data.success ? 'Вход подтверждён' : 'Нужен пароль',
        note: data.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось подключиться.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="hero">
        <div className="hero__content">
          <p className="badge">Life Protocol · v2.1</p>
          <h1>Система, которая держит тебя, когда всё шумит.</h1>
          <p className="subtitle">
            Мы не требуем. Мы бережно создаём рамки, в которых воля возвращается сама.
          </p>
          <div className="hero__actions">
            <button className="primary" type="button" onClick={handleStartRitual}>
              Начать ритуал
            </button>
            <button className="ghost" type="button" onClick={handleToggleMode}>
              {modeOpen ? 'Скрыть мой режим' : 'Показать мой режим'}
            </button>
          </div>
          {modeOpen && (
            <div className="mode">
              {modeSteps.map((step) => (
                <div key={step.title} className="mode__item">
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="hero__card">
          <h2>Состояние сейчас</h2>
          <p className="muted">Нейтральная фиксация вместо оценки.</p>
          <div className="metrics">
            {metrics.map((metric) => (
              <div key={metric.label} className="metric">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
          <div className="progress">
            <div className="progress__head">
              <span>Ритм сегодня</span>
              <strong>
                {progress.completed}/{progress.total}
              </strong>
            </div>
            <div className="progress__bar">
              <span style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
          <div className="pulse">
            <div className="pulse__dot" />
            <p>AI рядом. Он удерживает ритм.</p>
          </div>
        </div>
      </section>

      <section className="rituals" ref={ritualsRef}>
        <div className="rituals__header">
          <div>
            <h2>Сегодняшние мягкие рамки</h2>
            <p className="feedback">{feedback}</p>
          </div>
          {focusRitual && (
            <div className="focus">
              <p className="focus__label">Текущий фокус</p>
              <h3>{focusRitual.title}</h3>
              <p>{focusRitual.detail}</p>
            </div>
          )}
        </div>
        <div className="rituals__grid">
          {rituals.map((ritual) => (
            <article key={ritual.title} className={`ritual ritual--${ritual.status}`}>
              <div>
                <h3>{ritual.title}</h3>
                <p>{ritual.detail}</p>
              </div>
              <div className="ritual__meta">
                <span>{ritual.duration}</span>
                {ritual.status === 'done' ? <span>Готово</span> : <span>Мягкий шаг</span>}
              </div>
              <button
                className={ritual.status === 'done' ? 'ghost ghost--disabled' : 'ghost'}
                type="button"
                onClick={() => handleCompleteRitual(ritual.id)}
                disabled={ritual.status === 'done'}
              >
                {ritual.status === 'done' ? 'Отмечено' : 'Я сделаю это'}
              </button>
            </article>
          ))}
        </div>
        <div className="log">
          <h3>Лента фиксаций</h3>
          {logEntries.length === 0 ? (
            <p className="muted">Пока тишина. Первый шаг появится здесь.</p>
          ) : (
            <ul>
              {logEntries.map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.title}</strong>
                  <span>{entry.timestamp}</span>
                  <p>{entry.note}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="cta" ref={authRef}>
        <div>
          <h2>Ты не обязан справляться в одиночку.</h2>
          <p>
            Life Protocol удерживает пространство, пока ты возвращаешь устойчивость. Без давления и
            сравнения.
          </p>
        </div>
        <button className="primary" type="button" onClick={handleAuthOpen}>
          Войти или создать профиль
        </button>
        {authOpen && (
          <form className="auth" onSubmit={handleAuthSubmit}>
            <div className="auth__field">
              <label htmlFor="login">Логин</label>
              <input
                id="login"
                name="login"
                value={authForm.login}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, login: event.target.value }))}
                placeholder="life@protocol"
                required
              />
            </div>
            <div className="auth__field">
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            <button className="primary" type="submit" disabled={authLoading}>
              {authLoading ? 'Проверяем...' : 'Подтвердить'}
            </button>
            {authResult && <p className="auth__result">{authResult}</p>}
            {authError && <p className="auth__error">{authError}</p>}
          </form>
        )}
      </section>
    </main>
  );
}
