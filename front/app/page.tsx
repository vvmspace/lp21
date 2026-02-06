'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AuthUser, DailyStatus, LogEntry, Metric, Ritual, Task } from './lib/types';
import { LanguageSwitcher } from './lib/language-switcher';
import { useLocale, type Locale } from './lib/i18n';

const apiUrl = '/api';

const buildUrl = (path: string, params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return `${apiUrl}${path}${query ? `?${query}` : ''}`;
};

export default function HomePage() {
  const router = useRouter();
  const { t, locale, data } = useLocale();
  const ritualsRef = useRef<HTMLDivElement | null>(null);
  const authRef = useRef<HTMLDivElement | null>(null);
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState(t('common.loading'));
  const [modeOpen, setModeOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);
  const [countdown, setCountdown] = useState('00:00:00');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const isLocked = !authUser;
  const modeSteps = data.hero.modeSteps;

  const progress = useMemo(() => {
    const total = rituals.length;
    const completed = rituals.filter((ritual) => ritual.status === 'done').length;
    return { total, completed, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
  }, [rituals]);

  const focusRitual = rituals.find((ritual) => ritual.id === focusId) ?? null;

  const formatTime = (value: string) =>
    new Intl.DateTimeFormat(data.common.dateLocale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));

  const authHeaders: HeadersInit = useMemo((): HeadersInit => {
    if (!authUser) {
      return {} as HeadersInit;
    }
    return {
      'x-auth-login': authUser.login,
      'x-auth-password': authUser.password,
    };
  }, [authUser]);

  const requestParams = useMemo(
    () => ({
      lang: locale,
      login: authUser?.login,
    }),
    [locale, authUser?.login],
  );

  const handleLanguageUpdate = async (nextLocale: Locale) => {
    if (!authUser) {
      return;
    }
    const nextUser = { ...authUser, language: nextLocale };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lp-auth', JSON.stringify(nextUser));
    }
    setAuthUser(nextUser);
    await fetch(`${apiUrl}/v1/language`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ language: nextLocale }),
    });
  };

  const fetchDailyStatus = async () => {
    try {
      const response = await fetch(buildUrl('/v1/daily', requestParams));
      if (!response.ok) {
        throw new Error(t('errors.daily'));
      }
      const dataResponse: DailyStatus = await response.json();
      setDailyStatus(dataResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.dailyFallback');
      setLoadError(message);
    }
  };

  const pushLog = async (title: string, note: string) => {
    const response = await fetch(`${apiUrl}/v1/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ title, note }),
    });

    if (!response.ok) {
      throw new Error(t('errors.log'));
    }

    const log: LogEntry = await response.json();
    setLogEntries((prev) => [log, ...prev]);
  };

  const loadState = async () => {
    try {
      const [ritualsResponse, metricsResponse, logsResponse] = await Promise.all([
        fetch(buildUrl('/v1/rituals', requestParams)),
        fetch(buildUrl('/v1/metrics', requestParams)),
        fetch(`${apiUrl}/v1/logs`, {
          headers: authHeaders,
        }),
      ]);

      if (!ritualsResponse.ok || !metricsResponse.ok || !logsResponse.ok) {
        throw new Error(t('errors.state'));
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
        ritualsData.length === 0 ? t('rituals.feedbackEmpty') : t('rituals.feedbackChoose'),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.stateFallback');
      setLoadError(message);
      setFeedback(t('errors.stateFailed'));
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(buildUrl('/v1/tasks', requestParams));
      if (!response.ok) {
        throw new Error(t('errors.tasks'));
      }
      const dataResponse: Task[] = await response.json();
      setTasks(dataResponse);
      setTasksError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.tasksFallback');
      setTasksError(message);
    }
  };

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('lp-auth') : null;
    if (stored) {
      try {
        setAuthUser(JSON.parse(stored) as AuthUser);
      } catch {
        setAuthUser(null);
      }
    }
    setUserLoaded(true);
  }, []);

  useEffect(() => {
    if (!userLoaded) {
      return;
    }
    setFeedback(t('common.loading'));
    void loadState();
  }, [userLoaded, authUser, locale, t]);

  useEffect(() => {
    if (!dailyStatus) {
      return undefined;
    }

    const updateCountdown = () => {
      const remaining = Math.max(new Date(dailyStatus.nextResetAt).getTime() - Date.now(), 0);
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

  const handleLockedAction = () => {
    router.push('/auth');
  };

  const handleStartRitual = async () => {
    if (isLocked) {
      handleLockedAction();
      return;
    }
    try {
      const response = await fetch(buildUrl('/v1/rituals/start', requestParams), {
        method: 'POST',
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error(t('errors.startRitual'));
      }

      const updated: Ritual[] = await response.json();
      setRituals(updated);
      const active = updated.find((ritual) => ritual.status === 'active') ?? null;
      setFocusId(active?.id ?? null);
      if (active) {
        setFeedback(t('feedback.startFocus', { title: active.title }));
        await pushLog(t('logs.sessionStartedTitle'), t('logs.sessionStartedNote', { title: active.title }));
      }
      void fetchDailyStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.startRitual');
      setLoadError(message);
    }
  };

  const handleCompleteRitual = async (ritualId: string) => {
    if (isLocked) {
      handleLockedAction();
      return;
    }
    try {
      const response = await fetch(buildUrl(`/v1/rituals/${ritualId}/complete`, requestParams), {
        method: 'POST',
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error(t('errors.completeRitual'));
      }

      const updated: Ritual[] = await response.json();
      setRituals(updated);
      const completedRitual = updated.find((ritual) => ritual.id === ritualId);
      if (completedRitual) {
        await pushLog(
          t('logs.ritualCompletedTitle', { title: completedRitual.title }),
          t('logs.ritualCompletedNote'),
        );
      }
      const next = updated.find((ritual) => ritual.status === 'active') ?? null;
      setFocusId(next?.id ?? null);
      const total = updated.length;
      const completed = updated.filter((ritual) => ritual.status === 'done').length;
      setFeedback(
        t('feedback.complete', {
          title: completedRitual?.title ?? t('feedback.completedFallback'),
          completed,
          total,
        }),
      );
      const metricsResponse = await fetch(buildUrl('/v1/metrics', requestParams));
      if (metricsResponse.ok) {
        const metricsData: Metric[] = await metricsResponse.json();
        setMetrics(metricsData);
      }
      void fetchDailyStatus();
      void fetchTasks();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.completeRitual');
      setLoadError(message);
    }
  };

  const handleToggleMode = async () => {
    if (isLocked) {
      handleLockedAction();
      return;
    }
    setModeOpen((prev) => !prev);
    try {
      await pushLog(t('logs.modeOpenedTitle'), t('logs.modeOpenedNote'));
    } catch {
      // ignore
    }
  };

  const handleSwipeTask = async (taskId: string) => {
    if (isLocked) {
      handleLockedAction();
      return;
    }
    try {
      const response = await fetch(buildUrl(`/v1/tasks/${taskId}/swipe`, requestParams), {
        method: 'POST',
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error(t('errors.swapTask'));
      }
      const dataResponse: Task[] = await response.json();
      setTasks(dataResponse);
      setTasksError(null);
      await pushLog(t('logs.taskSwappedTitle'), t('logs.taskSwappedNote'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.swapTask');
      setTasksError(message);
    }
  };

  return (
    <main className="page">
      <section className="hero">
        <div className="hero__content">
          <div className="hero__header">
            <p className="badge">{data.hero.badge}</p>
            <LanguageSwitcher onChange={handleLanguageUpdate} />
          </div>
          <h1>{data.hero.title}</h1>
          <p className="subtitle">{data.hero.subtitle}</p>
          <div className="hero__actions">
            <button
              className={isLocked ? 'primary primary--disabled' : 'primary'}
              type="button"
              onClick={handleStartRitual}
              aria-disabled={isLocked}
            >
              {data.hero.start}
            </button>
            <button
              className={isLocked ? 'ghost ghost--disabled' : 'ghost'}
              type="button"
              onClick={handleToggleMode}
              aria-disabled={isLocked}
            >
              {modeOpen ? data.hero.hideMode : data.hero.showMode}
            </button>
          </div>
          {isLocked && (
            <div className="lock">
              <p>{data.lock.hint}</p>
              <Link className="ghost" href="/auth">
                {data.lock.cta}
              </Link>
            </div>
          )}
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
          <h2>{data.hero.stateTitle}</h2>
          <p className="muted">{data.hero.stateSubtitle}</p>
          <div className="metrics">
            {metrics.length === 0 ? (
              <p className="muted">{data.metrics.loading}</p>
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
              <span>{data.metrics.progressLabel}</span>
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
              <div className="countdown__icon" aria-label={data.metrics.countdownIconLabel}>
                ⏳
              </div>
              <div>
                <p>{data.metrics.completedLabel}</p>
                <strong>{countdown}</strong>
              </div>
            </div>
          )}
          <div className="pulse">
            <div className="pulse__dot" />
            <p>{data.common.aiPulse}</p>
          </div>
        </div>
      </section>

      <section className="rituals" ref={ritualsRef}>
        <div className="rituals__header">
          <div>
            <h2>{data.rituals.title}</h2>
            <p className="feedback">{feedback}</p>
          </div>
          {focusRitual && (
            <div className="focus">
              <p className="focus__label">{data.rituals.focusLabel}</p>
              <h3>{focusRitual.title}</h3>
              <p>{focusRitual.detail}</p>
            </div>
          )}
        </div>
        <div className="rituals__grid">
          {rituals.length === 0 ? (
            <p className="muted">{data.rituals.loading}</p>
          ) : (
            rituals.map((ritual) => (
              <article key={ritual.title} className={`ritual ritual--${ritual.status}`}>
                <div>
                  <h3>{ritual.title}</h3>
                  <p>{ritual.detail}</p>
                </div>
                <div className="ritual__meta">
                  <span>{ritual.duration}</span>
                  {ritual.status === 'done' ? <span>{data.rituals.statusDone}</span> : <span>{data.rituals.statusSoft}</span>}
                </div>
                <button
                  className={
                    ritual.status === 'done' || isLocked ? 'ghost ghost--disabled' : 'ghost'
                  }
                  type="button"
                  onClick={() => handleCompleteRitual(ritual.id)}
                  aria-disabled={ritual.status === 'done' || isLocked}
                >
                  {ritual.status === 'done' ? data.rituals.buttonDone : data.rituals.buttonDo}
                </button>
              </article>
            ))
          )}
        </div>
        <div className="log">
          <h3>{data.rituals.logTitle}</h3>
          {logEntries.length === 0 ? (
            <p className="muted">{data.rituals.logEmpty}</p>
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
          <h2>{data.tasks.title}</h2>
          <p className="muted">{data.tasks.subtitle}</p>
        </div>
        {tasksError && <p className="auth__error">{tasksError}</p>}
        <div className="tasks__grid">
          {tasks.length === 0 ? (
            <p className="muted">{data.tasks.loading}</p>
          ) : (
            tasks.map((task) => (
              <article key={task.id} className="task-card">
                <div>
                  <h3>{task.title}</h3>
                  <p>{task.detail}</p>
                </div>
                <button
                  className={isLocked ? 'ghost ghost--disabled' : 'ghost'}
                  type="button"
                  onClick={() => handleSwipeTask(task.id)}
                  aria-disabled={isLocked}
                >
                  {data.tasks.swap}
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="cta" ref={authRef}>
        <div>
          <h2>{data.cta.title}</h2>
          <p>{data.cta.subtitle}</p>
        </div>
        <Link className="primary" href="/auth">
          {data.cta.action}
        </Link>
      </section>
    </main>
  );
}
