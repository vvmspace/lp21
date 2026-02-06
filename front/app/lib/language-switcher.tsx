'use client';

import type { ChangeEvent } from 'react';
import { useId } from 'react';
import { useLocale, type Locale } from './i18n';

type LanguageSwitcherProps = {
  onChange?: (locale: Locale) => void;
  className?: string;
};

export const LanguageSwitcher = ({ onChange, className }: LanguageSwitcherProps) => {
  const { locale, setLocale, data, languages } = useLocale();
  const selectId = useId();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value as Locale;
    setLocale(nextLocale);
    onChange?.(nextLocale);
  };

  const current = languages.find((item) => item.language === locale);

  return (
    <div className={`language ${className ?? ''}`.trim()}>
      <span className="language__icon" aria-hidden>
        {current?.icon ?? '🌐'}
      </span>
      <label className="sr-only" htmlFor={selectId}>
        {data.language.label}
      </label>
      <select id={selectId} value={locale} onChange={handleChange} aria-label={data.language.label}>
        {languages.map((item) => (
          <option key={item.language} value={item.language}>
            {item.icon} {item.language.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
};
