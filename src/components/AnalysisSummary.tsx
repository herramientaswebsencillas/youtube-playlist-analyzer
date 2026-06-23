'use client';

import { useAnalysisStore } from '@/store/useAnalysisStore';
import { countDuplicateItems } from '@/lib/analysis/duplicates';
import { playlistUrl, safeYouTubeUrl } from '@/lib/utils/sanitize';
import { CachePill, StatCard } from './primitives';

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Resumen general: metadatos de la playlist y totales del análisis. */
export function AnalysisSummary() {
  const result = useAnalysisStore((s) => s.result);
  const fromCache = useAnalysisStore((s) => s.fromCache);
  const status = useAnalysisStore((s) => s.status);
  const refresh = useAnalysisStore((s) => s.refresh);

  if (!result) return null;

  const { info } = result;
  const url = safeYouTubeUrl(playlistUrl(info.playlistId));
  const duplicateItems = countDuplicateItems(result.duplicates);

  return (
    <section className="rounded-xl2 border border-line bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold leading-tight">
            {info.title}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="font-mono">{info.playlistId}</span>
            {info.channelTitle && <span>· {info.channelTitle}</span>}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-ink underline-offset-2 hover:underline"
              >
                Abrir en YouTube
              </a>
            )}
          </p>
          <p className="mt-1 text-xs text-muted">
            Analizado el {formatDateTime(result.analyzedAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {fromCache && <CachePill />}
          <button
            type="button"
            onClick={() => void refresh(info.playlistId)}
            disabled={status === 'loading'}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper disabled:opacity-60"
          >
            Actualizar
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Elementos" value={result.videos.length} />
        <StatCard label="Canciones repetidas" value={duplicateItems} tone="warn" />
        <StatCard
          label="Grupos de duplicados"
          value={result.duplicates.length}
          tone="warn"
        />
        <StatCard
          label="No disponibles"
          value={result.unavailable.length}
          tone="danger"
        />
      </div>
    </section>
  );
}
