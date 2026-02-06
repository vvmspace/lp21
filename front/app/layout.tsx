import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Life Protocol',
  description: 'Lifestyle guidance system prototype',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {children}
      </body>
    </html>
  );
}
