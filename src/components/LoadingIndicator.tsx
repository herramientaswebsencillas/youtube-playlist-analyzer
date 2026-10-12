'use client';

import { useAnalysisStore } from '@/store/useAnalysisStore';

/**
 * Indicador de carga mostrado durante el análisis. Permite cancelarlo: si se
 * cierra el reto de reCAPTCHA sin resolverlo, esta es la salida inmediata.
 */
export function LoadingIndicator() {
  const cancelAnalysis = useAnalysisStore((s) => s.cancelAnalysis);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-4 text-sm text-muted shadow-card">
      <span
        aria-hidden
        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent"
      />
      <p role="status" aria-live="polite" className="flex-1">
        Analizando la playlist… obteniendo elementos y verificando
        disponibilidad.
      </p>
      <button
        type="button"
        onClick={cancelAnalysis}
        className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand-ink"
      >
        Cancelar
      </button>
    </div>
  );
}
