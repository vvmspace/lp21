'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

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
  createdAt: string;
};

type Metric = {
  label: string;
  value: string;
};

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

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

export default function HomePage() {
  const ritualsRef = useRef<HTMLDivElement | null>(null);
  const authRef = useRef<HTMLDivElement | null>(null);
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('Загружаем состояние...');
  const [modeOpen, setModeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({ login: '', password: '' });
  const [authResult, setAuthResult] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const progress = useMemo(() => {
    const total = rituals.length;
    const completed = rituals.filter((ritual) => ritual.status === 'done').length;
    return { total, completed, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
  }, [rituals]);

  const focusRitual = rituals.find((ritual) => ritual.id === focusId) ?? null;

  const loadState = async () => {
    try {
      const [ritualsResponse, metricsResponse, logsResponse] = await Promise.all([
        fetch(`${apiUrl}/v1/rituals`),
        fetch(`${apiUrl}/v1/metrics`),
        fetch(`${apiUrl}/v1/logs`),
      ]);

      if (!ritualsResponse.ok || !metricsResponse.ok || !logsResponse.ok) {
        throw new Error('Не удалось получить состояние.');
      }

      const ritualsData: Ritual[] = await ritualsResponse.json();
      const metricsData: Metric[] = await metricsResponse.json();
      const logsData: LogEntry[] = await logsResponse.json();

      setRituals(ritualsData);
      setMetrics(metricsData);
      setLogEntries(logsData);

      const active = ritualsData.find((ritual) => ritual.status === 'active') ?? null;
      setFocusId(active?.id ?? null);
      setFeedback(
        ritualsData.length === 0
          ? 'Нет активных рамок. Добавь первый шаг.'
          : 'Нажми на любой ритуал, чтобы зафиксировать шаг.',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка загрузки.';
      setLoadError(message);
      setFeedback('Не удалось загрузить состояние.');
    }
  };

  useEffect(() => {
    void loadState();
  }, []);

  const pushLog = async (title: string, note: string) => {
    const response = await fetch(`${apiUrl}/v1/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, note }),
    });

    if (!response.ok) {
      throw new Error('Не удалось зафиксировать шаг.');
    }

    const log: LogEntry = await response.json();
    setLogEntries((prev) => [log, ...prev]);
  };

  const handleStartRitual = async () => {
    try {
      const response = await fetch(`${apiUrl}/v1/rituals/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Не удалось запустить ритуал.');
      }

      const updated: Ritual[] = await response.json();
      setRituals(updated);
      const active = updated.find((ritual) => ritual.status === 'active') ?? null;
      setFocusId(active?.id ?? null);
      if (active) {
        setFeedback(`Старт мягкой сессии. Сейчас фокус: ${active.title}.`);
        await pushLog('Сессия началась', `Фокус: ${active.title}.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка запуска.';
      setLoadError(message);
    }
  };

  const handleCompleteRitual = async (ritualId: string) => {
    try {
      const response = await fetch(`${apiUrl}/v1/rituals/${ritualId}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Не удалось завершить ритуал.');
      }

      const updated: Ritual[] = await response.json();
      setRituals(updated);
      const completedRitual = updated.find((ritual) => ritual.id === ritualId);
      if (completedRitual) {
        await pushLog(`Отмечено: ${completedRitual.title}`, 'Рамки удержаны без давления.');
      }
      const next = updated.find((ritual) => ritual.status === 'active') ?? null;
      setFocusId(next?.id ?? null);
      const total = updated.length;
      const completed = updated.filter((ritual) => ritual.status === 'done').length;
      setFeedback(`Зафиксировано: ${completedRitual?.title ?? 'ритуал'}. ${completed}/${total}.`);
      const metricsResponse = await fetch(`${apiUrl}/v1/metrics`);
      if (metricsResponse.ok) {
        const metricsData: Metric[] = await metricsResponse.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка завершения.';
      setLoadError(message);
    }
  };

  const handleToggleMode = async () => {
    setModeOpen((prev) => !prev);
    try {
      await pushLog('Режим раскрыт', 'План дня показан без давления.');
    } catch {
      // do nothing, log will be retried on next successful action
    }
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
      const response = await fetch(`${apiUrl}/v1/session/auth`, {
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
      await pushLog(data.success ? 'Вход подтверждён' : 'Нужен пароль', data.message);
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
          {loadError && <p className="auth__error">{loadError}</p>}
        </div>
        <div className="hero__card">
          <h2>Состояние сейчас</h2>
          <p className="muted">Нейтральная фиксация вместо оценки.</p>
          <div className="metrics">
            {metrics.length === 0 ? (
              <p className="muted">Метрики загружаются...</p>
            ) : (
              metrics.map((metric) => (
                <div key={metric.label} className="metric">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))
            )}
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
          {rituals.length === 0 ? (
            <p className="muted">Ритуалы загружаются...</p>
          ) : (
            rituals.map((ritual) => (
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
            ))
          )}
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
                  <span>{formatTime(entry.createdAt)}</span>
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
