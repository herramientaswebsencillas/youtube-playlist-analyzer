'use client';

import { clearHistory } from '@/lib/storage/history';

/**
 * Límite de errores de la aplicación. Sin él, un error de render deja la
 * página en blanco. La causa más probable en una app sin backend son datos
 * locales inesperados, así que se ofrece borrarlos además de reintentar.
 */
export default function AppError({ retry }: { retry: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div
        role="alert"
        className="rounded-xl2 border border-danger/30 bg-danger-soft p-6 text-sm text-danger"
      >
        <h1 className="font-display text-xl font-semibold">
          Algo salió mal al mostrar la aplicación
        </h1>
        <p className="mt-2 text-danger/80">
          Vuelve a intentarlo. Si el error persiste, puede deberse a datos
          guardados en este navegador: bórralos para empezar de cero (perderás
          el historial local; si lo exportaste a JSON, puedes reimportarlo).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-ink"
          >
            Reintentar
          </button>
          <button
            type="button"
            onClick={() => {
              clearHistory();
              window.location.reload();
            }}
            className="rounded-lg border border-danger/30 px-4 py-2 font-medium text-danger transition hover:bg-surface"
          >
            Borrar datos locales y recargar
          </button>
        </div>
      </div>
    </div>
  );
}
