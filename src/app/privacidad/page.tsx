import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacidad · YouTube Playlist Analyzer',
  description:
    'Qué datos usa YouTube Playlist Analyzer, dónde se guardan y qué servicios de terceros intervienen.',
};

/** Última revisión del texto; actualízala cuando cambie el comportamiento. */
const LAST_UPDATED = '29 de septiembre de 2026';

const YOUTUBE_TERMS_URL = 'https://www.youtube.com/t/terms';
const GOOGLE_PRIVACY_URL = 'https://policies.google.com/privacy';
const GOOGLE_SECURITY_SETTINGS_URL =
  'https://security.google.com/settings/security/permissions';
const REPO_URL =
  'https://github.com/herramientaswebsencillas/youtube-playlist-analyzer';

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

export default function PrivacyPage() {
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
          Privacidad
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Aviso de privacidad
        </h1>
        <p className="mt-3 text-xs text-muted">
          Última actualización: {LAST_UPDATED}
        </p>
      </header>

      <Section title="Uso de YouTube API Services">
        <p>
          Esta aplicación usa YouTube API Services para leer información
          pública de playlists y videos. Al usarla aceptas los{' '}
          <ExternalLink href={YOUTUBE_TERMS_URL}>
            Términos de servicio de YouTube
          </ExternalLink>
          . Los datos que YouTube y Google tratan se rigen por la{' '}
          <ExternalLink href={GOOGLE_PRIVACY_URL}>
            Política de privacidad de Google
          </ExternalLink>
          .
        </p>
        <p>
          La aplicación no pide iniciar sesión con Google ni accede a tu cuenta:
          solo consulta playlists públicas en modo lectura. Si en algún momento
          concediste acceso a otra aplicación, puedes revisarlo en la{' '}
          <ExternalLink href={GOOGLE_SECURITY_SETTINGS_URL}>
            configuración de seguridad de tu cuenta de Google
          </ExternalLink>
          .
        </p>
      </Section>

      <Section title="Qué datos se usan">
        <p>
          Solo el ID o la URL de la playlist que escribes o importas, y la
          información pública que la API devuelve sobre ella: título, canal,
          títulos de los videos, miniaturas y estado de disponibilidad.
        </p>
        <p>
          La aplicación no tiene servidor propio, cuentas de usuario, cookies
          propias ni herramientas de analítica. Los desarrolladores no reciben
          ninguno de estos datos.
        </p>
      </Section>

      <Section title="Dónde se guardan">
        <p>
          Cada análisis se guarda únicamente en el almacenamiento local
          (LocalStorage) de tu navegador, para poder consultarlo después sin
          volver a llamar a la API y para recuperar títulos de videos que
          desaparezcan. Estos datos no salen de tu dispositivo, salvo que tú
          exportes un archivo JSON.
        </p>
        <p>
          Puedes borrarlos cuando quieras con «Eliminar» en cada entrada o con
          «Limpiar historial», o borrando los datos del sitio desde tu
          navegador. No se eliminan de forma automática.
        </p>
      </Section>

      <Section title="Servicios de terceros">
        <p>
          El navegador se conecta directamente a estos servicios de Google:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink">YouTube Data API</strong>
            {' '}(googleapis.com), para obtener la información de las playlists.
          </li>
          <li>
            <strong className="text-ink">Google reCAPTCHA</strong>
            {' '}(google.com y gstatic.com), que verifica que quien hace la consulta
            es una persona. reCAPTCHA recoge información del dispositivo y del
            uso, sujeta a la{' '}
            <ExternalLink href={GOOGLE_PRIVACY_URL}>
              Política de privacidad de Google
            </ExternalLink>
            .
          </li>
          <li>
            <strong className="text-ink">Miniaturas de YouTube</strong>
            {' '}(ytimg.com), que se cargan al mostrar los resultados.
          </li>
        </ul>
        <p>
          Como en cualquier conexión a internet, estos servicios reciben tu
          dirección IP y datos técnicos del navegador.
        </p>
      </Section>

      <Section title="Contacto">
        <p>
          Para dudas sobre este aviso o sobre la aplicación, abre un issue en el{' '}
          <ExternalLink href={REPO_URL}>repositorio de GitHub</ExternalLink>.
        </p>
      </Section>

      <footer className="mt-12 border-t border-line pt-6 text-xs text-muted">
        <Link href="/" className="font-medium text-brand-ink hover:text-brand">
          Analizar una playlist
        </Link>
        <span className="mx-2">·</span>
        <Link href="/acerca-de" className="hover:text-ink">
          Acerca de
        </Link>
      </footer>
    </div>
  );
}
