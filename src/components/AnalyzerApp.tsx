'use client';

import { useEffect } from 'react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { PlaylistInput } from './PlaylistInput';
import { ImportButton } from './ImportButton';
import { LoadingIndicator } from './LoadingIndicator';
import { ErrorMessage } from './ErrorMessage';
import { AnalysisSummary } from './AnalysisSummary';
import { ExportButtons } from './ExportButtons';
import { DuplicatesSection } from './DuplicatesSection';
import { UnavailableSection } from './UnavailableSection';
import { HistoryPanel } from './HistoryPanel';

const API_KEY_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_YOUTUBE_API_KEY);

/** Componente raíz de la aplicación (lado del cliente). */
export function AnalyzerApp() {
  const status = useAnalysisStore((s) => s.status);
  const error = useAnalysisStore((s) => s.error);
  const result = useAnalysisStore((s) => s.result);
  const hydrateHistory = useAnalysisStore((s) => s.hydrateHistory);

  // Cargar el historial guardado al montar (sólo en el navegador).
  useEffect(() => {
    hydrateHistory();
  }, [hydrateHistory]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand-ink">
          YouTube · YouTube Music
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Analizador de playlists
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Detecta canciones duplicadas y videos eliminados, privados o no
          disponibles dentro de cualquier playlist pública. Pega su URL o ID
          para comenzar.
        </p>
      </header>

      {!API_KEY_CONFIGURED && (
        <div className="mb-6 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          No se detectó una clave de API. Define{' '}
          <code className="font-mono">NEXT_PUBLIC_YOUTUBE_API_KEY</code> antes de
          compilar para poder analizar playlists.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-6">
          <PlaylistInput />

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <ImportButton />
            <span className="text-xs text-muted">
              Restaura un análisis exportado (JSON) para recuperar títulos de
              videos eliminados.
            </span>
          </div>

          {status === 'error' && error && <ErrorMessage error={error} />}
          {status === 'loading' && <LoadingIndicator />}

          {result && status !== 'loading' && (
            <div className="space-y-6">
              <AnalysisSummary />
              <ExportButtons />
              <DuplicatesSection />
              <UnavailableSection />
            </div>
          )}

          {status === 'idle' && !result && (
            <div className="rounded-xl2 border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
              <p className="text-sm text-muted">
                Los resultados aparecerán aquí tras analizar una playlist.
              </p>
            </div>
          )}
        </main>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <HistoryPanel />
        </aside>
      </div>

      <footer className="mt-12 border-t border-line pt-6 text-xs text-muted">
        Procesamiento 100% en el navegador. Los análisis se guardan localmente
        para evitar consultas repetidas a la API.
      </footer>
    </div>
  );
}
