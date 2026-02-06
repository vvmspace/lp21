'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DailyStatus, LogEntry, Metric, Ritual, Task } from './lib/types';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('Загружаем состояние...');
  const [modeOpen, setModeOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);
  const [countdown, setCountdown] = useState('00:00:00');

  const progress = useMemo(() => {
    const total = rituals.length;
    const completed = rituals.filter((ritual) => ritual.status === 'done').length;
    return { total, completed, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
  }, [rituals]);

  const focusRitual = rituals.find((ritual) => ritual.id === focusId) ?? null;

  const fetchDailyStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/v1/daily`);
      if (!response.ok) {
        throw new Error('Не удалось получить ежедневный ритм.');
      }
      const data: DailyStatus = await response.json();
      setDailyStatus(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка ежедневного ритма.';
      setLoadError(message);
    }
  };

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
      void fetchDailyStatus();
      void fetchTasks();

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

  useEffect(() => {
    if (!dailyStatus) {
      return undefined;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        new Date(dailyStatus.nextResetAt).getTime() - Date.now(),
        0,
      );
      const totalSeconds = Math.floor(remaining / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      setCountdown(`${hours}:${minutes}:${seconds}`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [dailyStatus]);

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

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${apiUrl}/v1/tasks`);
      if (!response.ok) {
        throw new Error('Не удалось получить предложения.');
      }
      const data: Task[] = await response.json();
      setTasks(data);
      setTasksError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка предложений.';
      setTasksError(message);
    }
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
      void fetchDailyStatus();
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
      void fetchDailyStatus();
      void fetchTasks();
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

  const handleSwipeTask = async (taskId: string) => {
    try {
      const response = await fetch(`${apiUrl}/v1/tasks/${taskId}/swipe`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Не удалось обновить предложение.');
      }
      const data: Task[] = await response.json();
      setTasks(data);
      setTasksError(null);
      await pushLog('Задача заменена', 'Пользователь попросил другой мягкий шаг.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка замены задачи.';
      setTasksError(message);
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
          {dailyStatus?.completed && (
            <div className="countdown">
              <div className="countdown__icon">⏳</div>
              <div>
                <p>Все рамки выполнены. До нового цикла:</p>
                <strong>{countdown}</strong>
              </div>
            </div>
          )}
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

      <section className="tasks">
        <div className="tasks__header">
          <h2>Мягкие предложения на сегодня</h2>
          <p className="muted">
            Они рождаются из твоего прогресса. Если не откликается — свайпни, система подстроится.
          </p>
        </div>
        {tasksError && <p className="auth__error">{tasksError}</p>}
        <div className="tasks__grid">
          {tasks.length === 0 ? (
            <p className="muted">AI подбирает предложения...</p>
          ) : (
            tasks.map((task) => (
              <article key={task.id} className="task-card">
                <div>
                  <h3>{task.title}</h3>
                  <p>{task.detail}</p>
                </div>
                <button className="ghost" type="button" onClick={() => handleSwipeTask(task.id)}>
                  Не моё — заменить
                </button>
              </article>
            ))
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
        <Link className="primary" href="/auth">
          Войти или создать профиль
        </Link>
      </section>
    </main>
  );
}
