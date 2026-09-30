import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

/**
 * Content-Security-Policy como defensa en profundidad. GitHub Pages no permite
 * cabeceras HTTP propias, así que se declara con <meta> (lo que deja fuera
 * `frame-ancestors`). `'unsafe-inline'` en script-src es necesario porque la
 * exportación estática de Next.js incrusta scripts inline de hidratación.
 * Solo se aplica en producción: `next dev` necesita eval y websockets.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://i.ytimg.com https://img.youtube.com https://*.ggpht.com",
  "font-src 'self'",
  "connect-src 'self' https://www.googleapis.com https://www.google.com/recaptcha/",
  'frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const metadata: Metadata = {
  title: 'YouTube Playlist Analyzer',
  description:
    'Analiza playlists públicas de YouTube y YouTube Music: detecta canciones duplicadas y videos no disponibles.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <head>
        {IS_PRODUCTION && (
          <meta
            httpEquiv="Content-Security-Policy"
            content={CONTENT_SECURITY_POLICY}
          />
        )}
      </head>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
