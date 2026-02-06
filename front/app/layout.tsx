import './globals.css';
import type { Metadata } from 'next';
import { LocaleProvider } from './lib/i18n';
import defaultLocale from './lib/locales/ru.json';

export const metadata: Metadata = {
  title: defaultLocale.meta.title,
  description: defaultLocale.meta.description,
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
