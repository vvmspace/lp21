'use client';

import type { ChangeEvent } from 'react';
import { useId } from 'react';
import { useLocale, type Locale } from './i18n';

type LanguageSwitcherProps = {
  onChange?: (locale: Locale) => void;
  className?: string;
};

export const LanguageSwitcher = ({ onChange, className }: LanguageSwitcherProps) => {
  const { locale, setLocale, data } = useLocale();
  const selectId = useId();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value as Locale;
    setLocale(nextLocale);
    onChange?.(nextLocale);
  };

  return (
    <div className={`language ${className ?? ''}`.trim()}>
      <span className="language__icon" aria-hidden>
        🌐
      </span>
      <label className="sr-only" htmlFor={selectId}>
        {data.language.label}
      </label>
      <select id={selectId} value={locale} onChange={handleChange} aria-label={data.language.label}>
        <option value="ru">{data.language.options.ru}</option>
        <option value="en">{data.language.options.en}</option>
        <option value="es">{data.language.options.es}</option>
      </select>
    </div>
  );
};
