import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos de uso · YouTube Playlist Analyzer',
  description:
    'Condiciones para usar YouTube Playlist Analyzer: servicio gratuito, sin garantías y sujeto a los términos de YouTube.',
};

/** Última revisión del texto; actualízala cuando cambien las condiciones. */
const LAST_UPDATED = '11 de octubre de 2026';

const YOUTUBE_TERMS_URL = 'https://www.youtube.com/t/terms';
const GOOGLE_PRIVACY_URL = 'https://policies.google.com/privacy';
const REPO_URL =
  'https://github.com/herramientaswebsencillas/youtube-playlist-analyzer';
const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-brand-ink underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-xl font-semibold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <nav className="mb-8 text-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-medium text-brand-ink transition hover:text-brand"
        >
          <span aria-hidden>←</span> Volver al analizador
        </Link>
      </nav>

      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand-ink">
          Términos
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Términos de uso
        </h1>
        <p className="mt-3 text-xs text-muted">
          Última actualización: {LAST_UPDATED}
        </p>
      </header>

      <Section title="El servicio">
        <p>
          YouTube Playlist Analyzer es una herramienta gratuita y de código
          abierto que analiza playlists públicas de YouTube y YouTube Music
          desde tu navegador. Al usarla aceptas estos términos.
        </p>
      </Section>

      <Section title="Términos de YouTube y Google">
        <p>
          La aplicación usa YouTube API Services. Al usarla aceptas también los{' '}
          <ExternalLink href={YOUTUBE_TERMS_URL}>
            Términos de servicio de YouTube
          </ExternalLink>
          , y los datos que tratan YouTube y Google se rigen por la{' '}
          <ExternalLink href={GOOGLE_PRIVACY_URL}>
            Política de privacidad de Google
          </ExternalLink>
          .
        </p>
        <p>
          Los títulos, miniaturas y demás contenido de las playlists pertenecen
          a sus respectivos dueños. La aplicación solo los muestra como
          referencia y no está afiliada a YouTube ni a Google.
        </p>
      </Section>

      <Section title="Uso aceptable">
        <p>Al usar la aplicación te comprometes a no:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Automatizar consultas ni usarla de forma que agote la cuota de la
            API compartida por todas las personas que la usan.
          </li>
          <li>
            Extraer la clave de la API para usarla fuera de esta aplicación.
          </li>
          <li>
            Usarla para fines contrarios a la ley o a los términos de YouTube.
          </li>
        </ul>
      </Section>

      <Section title="Sin garantías">
        <p>
          La aplicación se ofrece «tal cual», sin garantías de ningún tipo, en
          los términos de su{' '}
          <ExternalLink href={LICENSE_URL}>licencia MIT</ExternalLink>. Puede
          dejar de estar disponible en cualquier momento, por ejemplo, cuando se
          agota la cuota diaria de la API.
        </p>
        <p>
          Los resultados son estimaciones automáticas: la detección de
          duplicados se basa en heurísticas y puede tener errores. Revísalos
          antes de borrar algo de tus playlists.
        </p>
      </Section>

      <Section title="Tus datos">
        <p>
          Cómo se tratan los datos se explica en el{' '}
          <Link
            href="/privacidad"
            className="font-medium text-brand-ink underline-offset-2 hover:underline"
          >
            aviso de privacidad
          </Link>
          .
        </p>
      </Section>

      <Section title="Cambios y contacto">
        <p>
          Estos términos pueden actualizarse; la fecha de arriba indica la
          última revisión. Para dudas, abre un issue en el{' '}
          <ExternalLink href={REPO_URL}>repositorio de GitHub</ExternalLink>.
        </p>
      </Section>

      <footer className="mt-12 border-t border-line pt-6 text-xs text-muted">
        <Link href="/" className="font-medium text-brand-ink hover:text-brand">
          Analizar una playlist
        </Link>
        <span className="mx-2">·</span>
        <Link href="/privacidad" className="hover:text-ink">
          Privacidad
        </Link>
        <span className="mx-2">·</span>
        <Link href="/acerca-de" className="hover:text-ink">
          Acerca de
        </Link>
      </footer>
    </div>
  );
}
