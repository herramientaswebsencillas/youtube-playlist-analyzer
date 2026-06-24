'use client';

import { useAnalysisStore } from '@/store/useAnalysisStore';
import { exportAnalysis } from '@/lib/export';

/**
 * Exporta el análisis como JSON. Es el formato de respaldo y el mismo que
 * acepta el botón de importar, de modo que exportar e importar quedan
 * homologados.
 */
export function ExportButtons() {
  const result = useAnalysisStore((s) => s.result);
  if (!result) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <button
        type="button"
        onClick={() => exportAnalysis(result)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand-ink"
      >
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M10 3v10m0 0l3.5-3.5M10 13L6.5 9.5M4 13v2.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Exportar análisis (JSON)
      </button>
      <span className="text-xs text-muted">
        Guárdalo como respaldo: puedes reimportarlo después.
      </span>
    </div>
  );
}
