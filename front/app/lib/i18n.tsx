'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from './locales/en.json';
import es from './locales/es.json';
import ru from './locales/ru.json';
import type { LanguageOption } from './types';

const locales = {
  en,
  es,
  ru,
} as const;

export type Locale = keyof typeof locales;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  data: (typeof locales)[Locale];
  languages: LanguageOption[];
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const defaultLocale: Locale = 'ru';

const resolveLocale = (value?: string | null): Locale => {
  if (!value) {
    return defaultLocale;
  }
  const normalized = value.toLowerCase();
  if (normalized.startsWith('en')) {
    return 'en';
  }
  if (normalized.startsWith('es')) {
    return 'es';
  }
  if (normalized.startsWith('ru')) {
    return 'ru';
  }
  return defaultLocale;
};

const getLocaleValue = (data: Record<string, unknown>, key: string): unknown =>
  key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, data);

const fallbackLanguages: LanguageOption[] = [
  { language: 'ru', icon: '🇷🇺' },
  { language: 'en', icon: '🇺🇸' },
  { language: 'es', icon: '🇪🇸' },
];

export const LocaleProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [languages, setLanguages] = useState<LanguageOption[]>(fallbackLanguages);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('lp-locale') : null;
    const storedUser = typeof window !== 'undefined' ? window.localStorage.getItem('lp-auth') : null;
    let userLocale: string | null = null;
    if (storedUser) {
      try {
        userLocale = (JSON.parse(storedUser) as { language?: string }).language ?? null;
      } catch {
        userLocale = null;
      }
    }
    const browserLocale = typeof navigator !== 'undefined' ? navigator.language : defaultLocale;
    setLocaleState(resolveLocale(userLocale ?? stored ?? browserLocale));
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lp-locale', locale);
    }
  }, [locale]);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await fetch('/api/v1/language');
        if (!response.ok) {
          return;
        }
        const dataResponse = (await response.json()) as { languages: LanguageOption[] };
        if (dataResponse.languages?.length) {
          setLanguages(dataResponse.languages);
        }
      } catch {
        // ignore, fallback list stays
      }
    };

    void loadLanguages();
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
  };

  const data = locales[locale] ?? locales[defaultLocale];

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      const value = getLocaleValue(data as Record<string, unknown>, key);
      if (typeof value !== 'string') {
        return key;
      }
      if (!params) {
        return value;
      }
      return Object.entries(params).reduce(
        (result, [paramKey, paramValue]) =>
          result.replace(new RegExp(`%${paramKey}%`, 'g'), String(paramValue)),
        value,
      );
    };
  }, [data]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, data, languages }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('LocaleContextError');
  }
  return context;
};
