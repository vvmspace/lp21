import en from '../../locales/en.json';
import es from '../../locales/es.json';
import ru from '../../locales/ru.json';

const locales = {
  en,
  es,
  ru,
} as const;

export type Locale = keyof typeof locales;

export const defaultLocale: Locale = 'ru';

export const resolveLocale = (value?: string): Locale => {
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

export const getLocaleData = (locale: Locale) => locales[locale] ?? locales[defaultLocale];

export const t = (locale: Locale, key: string, params?: Record<string, string | number>): string => {
  const data = getLocaleData(locale) as Record<string, unknown>;
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, data);

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
