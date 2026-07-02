import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Acerca de · YouTube Playlist Analyzer',
  description:
    'Qué hace YouTube Playlist Analyzer, para qué sirve y por qué es un proyecto open source que procesa todo en tu navegador.',
};

const REPO_URL =
  'https://github.com/herramientaswebsencillas/youtube-playlist-analyzer';

/** Tarjeta de funcionalidad reutilizada en la cuadrícula de características. */
function Feature({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <nav className="mb-8 flex items-center justify-between text-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-medium text-brand-ink transition hover:text-brand"
        >
          <span aria-hidden>←</span> Volver al analizador
        </Link>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-muted transition hover:text-ink"
        >
          Ver en GitHub
        </a>
      </nav>

      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand-ink">
          Acerca de
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          YouTube Playlist Analyzer
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Una herramienta web gratuita que revisa playlists públicas de{' '}
          <strong className="text-ink">YouTube</strong> y{' '}
          <strong className="text-ink">YouTube Music</strong> para encontrar
          canciones duplicadas y videos que ya no se pueden reproducir. Todo el
          análisis ocurre dentro de tu navegador: no hay servidores
          intermedios, cuentas ni bases de datos.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl font-semibold">
          ¿Qué puede hacer?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Feature title="Detecta canciones duplicadas">
            Agrupa los videos que corresponden a la misma canción comparando el
            título y el artista normalizados, para que no aparezca dos veces la
            misma pista aunque esté escrita de forma distinta.
          </Feature>
          <Feature title="Encuentra videos no disponibles">
            Identifica los elementos eliminados, privados o inaccesibles que en
            la playlist solo se ven como «Deleted video» o «Private video».
          </Feature>
          <Feature title="Recupera títulos perdidos">
            Si analizaste la playlist antes, reutiliza ese registro para
            mostrarte qué canción era un video que ahora aparece como eliminado.
          </Feature>
          <Feature title="Historial local">
            Guarda automáticamente cada análisis en tu navegador para volver a
            consultarlo.
          </Feature>
          <Feature title="Exporta e importa (JSON)">
            Descarga el análisis completo como archivo JSON y vuelve a cargarlo
            cuando quieras: es respaldo y, a la vez, la fuente para recuperar
            títulos de videos que desaparezcan más adelante.
          </Feature>
          <Feature title="100% en tu navegador">
            Se conecta únicamente en modo lectura a YouTube. Tus datos no se
            envían a ningún backend propio porque, sencillamente, no existe.
          </Feature>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-xl font-semibold">
          ¿Para qué es útil?
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Las playlists largas se ensucian con el tiempo: se cuelan canciones
            repetidas y, sobre todo, videos que sus dueños eliminan o vuelven
            privados, dejando huecos silenciosos imposibles de identificar desde
            la propia app de YouTube.
          </p>
          <p>
            Esta herramienta te da, en segundos, una lista clara de esos
            problemas para que puedas limpiar y mantener tus colecciones de
            música. Es especialmente práctica para quien cura playlists grandes,
            archiva mixes o quiere saber qué pista se «perdió» antes de buscar un
            reemplazo.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-xl font-semibold">
          Verificación anti-bots
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          Para evitar el uso automatizado, cada análisis que consulta a YouTube pasa primero por una
          verificación reCAPTCHA. Normalmente es invisible; solo verás un reto
          si el sistema detecta actividad sospechosa. Los resultados que se leen
          desde el historial local no requieren verificación.
        </p>
      </section>

      <section className="rounded-xl2 border border-line bg-brand-soft/50 px-6 py-6">
        <h2 className="font-display text-xl font-semibold text-brand-ink">
          Proyecto open source
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          YouTube Playlist Analyzer es de código abierto. Puedes
          revisar cómo funciona, reportar problemas, proponer mejoras o
          desplegar tu propia copia. El código completo está disponible en
          GitHub.
        </p>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-ink"
        >
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="h-4 w-4"
            fill="currentColor"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Ver el repositorio
        </a>
      </section>

      <footer className="mt-12 border-t border-line pt-6 text-xs text-muted">
        <Link href="/" className="font-medium text-brand-ink hover:text-brand">
          Analizar una playlist
        </Link>
        <span className="mx-2">·</span>
        Procesamiento 100% en el navegador.
      </footer>
    </div>
  );
}
