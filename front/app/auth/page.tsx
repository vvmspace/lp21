'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

const apiUrl = '/api';

export default function AuthPage() {
  const [authLoading, setAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({ login: '', password: '' });
  const [authResult, setAuthResult] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось подключиться.';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="hero hero--auth">
        <div className="hero__content">
          <p className="badge">Life Protocol · вход</p>
          <h1>Сначала мы бережно проверим рамки доступа.</h1>
          <p className="subtitle">
            Если ты здесь впервые, мы создадим профиль. Если ты уже был — просто подтвердим
            присутствие.
          </p>
        </div>
        <div className="hero__card">
          <h2>Авторизация</h2>
          <p className="muted">Никаких скрытых оценок. Только вход в пространство.</p>
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
          <Link className="ghost" href="/">
            Вернуться на главную
          </Link>
        </div>
      </section>
    </main>
  );
}
