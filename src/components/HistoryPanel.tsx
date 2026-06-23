'use client';

import { useAnalysisStore } from '@/store/useAnalysisStore';
import { EmptyState } from './primitives';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('es', { dateStyle: 'medium' });
}

/** Historial de análisis previos almacenados localmente. */
export function HistoryPanel() {
  const history = useAnalysisStore((s) => s.history);
  const openFromHistory = useAnalysisStore((s) => s.openFromHistory);
  const refresh = useAnalysisStore((s) => s.refresh);
  const removeHistory = useAnalysisStore((s) => s.removeHistory);
  const clearAllHistory = useAnalysisStore((s) => s.clearAllHistory);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Historial</h2>
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => clearAllHistory()}
            className="text-xs font-medium text-muted transition hover:text-danger"
          >
            Limpiar historial
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <EmptyState>
          Aún no hay análisis guardados. Los resultados se almacenan
          automáticamente en este navegador.
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {history.map((entry) => (
            <li
              key={entry.playlistId}
              className="rounded-xl border border-line bg-surface p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" title={entry.title}>
                    {entry.title}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted">
                    {entry.playlistId}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {formatDate(entry.analyzedAt)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                <span>{entry.totalItems} elementos</span>
                <span className="text-warn">
                  {entry.totalDuplicateItems} repetidos
                </span>
                <span className="text-danger">
                  {entry.totalUnavailable} no disponibles
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openFromHistory(entry.playlistId)}
                  className="rounded-lg bg-brand-soft px-3 py-1 text-xs font-medium text-brand-ink transition hover:bg-brand hover:text-white"
                >
                  Abrir
                </button>
                <button
                  type="button"
                  onClick={() => void refresh(entry.playlistId)}
                  className="rounded-lg border border-line px-3 py-1 text-xs font-medium text-ink transition hover:bg-paper"
                >
                  Actualizar
                </button>
                <button
                  type="button"
                  onClick={() => removeHistory(entry.playlistId)}
                  className="rounded-lg border border-line px-3 py-1 text-xs font-medium text-muted transition hover:border-danger hover:text-danger"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
