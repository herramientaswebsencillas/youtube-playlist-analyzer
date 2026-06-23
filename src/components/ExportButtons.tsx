'use client';

import { useAnalysisStore } from '@/store/useAnalysisStore';
import { exportAnalysis, type ExportFormat } from '@/lib/export';

const FORMATS: Array<{ format: ExportFormat; label: string }> = [
  { format: 'csv', label: 'CSV' },
  { format: 'json', label: 'JSON' },
  { format: 'html', label: 'HTML' },
];

/** Botones para exportar el análisis en distintos formatos. */
export function ExportButtons() {
  const result = useAnalysisStore((s) => s.result);
  if (!result) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium text-muted">Exportar:</span>
      {FORMATS.map(({ format, label }) => (
        <button
          key={format}
          type="button"
          onClick={() => exportAnalysis(result, format)}
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand-ink"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
