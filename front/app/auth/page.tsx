'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { LanguageSwitcher } from '../lib/language-switcher';
import { useLocale } from '../lib/i18n';

const apiUrl = '/api';

type AuthResponse = {
  success: boolean;
  message: string;
  user?: { login: string; createdAt: string; language?: string };
};

export default function AuthPage() {
  const { t, locale, data, setLocale } = useLocale();
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
        body: JSON.stringify({ ...authForm, language: locale }),
      });

      if (!response.ok) {
        throw new Error(t('errors.authServer'));
      }

      const dataResponse: AuthResponse = await response.json();
      if (!dataResponse.success) {
        setAuthError(dataResponse.message || t('errors.authFallback'));
        return;
      }

      const loginValue = dataResponse.user?.login ?? authForm.login;
      const userLanguage = dataResponse.user?.language ?? locale;
      const payload = { login: loginValue, language: userLanguage };

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lp-user', JSON.stringify(payload));
      }
      setLocale(userLanguage as typeof locale);
      setAuthResult(t('auth.result', { message: dataResponse.message, login: loginValue }));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.authFallback');
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="hero hero--auth">
        <div className="hero__content">
          <div className="hero__header">
            <p className="badge">{data.auth.badge}</p>
            <LanguageSwitcher />
          </div>
          <h1>{data.auth.title}</h1>
          <p className="subtitle">{data.auth.subtitle}</p>
        </div>
        <div className="hero__card">
          <h2>{data.auth.cardTitle}</h2>
          <p className="muted">{data.auth.cardSubtitle}</p>
          <form className="auth" onSubmit={handleAuthSubmit}>
            <div className="auth__field">
              <label htmlFor="login">{data.auth.loginLabel}</label>
              <input
                id="login"
                name="login"
                value={authForm.login}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, login: event.target.value }))}
                placeholder={data.auth.loginPlaceholder}
                required
              />
            </div>
            <div className="auth__field">
              <label htmlFor="password">{data.auth.passwordLabel}</label>
              <input
                id="password"
                name="password"
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder={data.auth.passwordPlaceholder}
                required
              />
            </div>
            <button className="primary" type="submit" disabled={authLoading}>
              {authLoading ? data.auth.submitting : data.auth.submit}
            </button>
            {authResult && <p className="auth__result">{authResult}</p>}
            {authError && <p className="auth__error">{authError}</p>}
          </form>
          <Link className="ghost" href="/">
            {data.auth.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
