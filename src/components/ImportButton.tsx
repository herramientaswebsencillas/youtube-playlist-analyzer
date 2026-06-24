'use client';

import { useRef } from 'react';
import { useAnalysisStore } from '@/store/useAnalysisStore';

/**
 * Botón para importar un análisis exportado (JSON). Restaura el resultado al
 * caché y al historial, lo que permite recuperar títulos de videos eliminados
 * aunque se hayan borrado los datos del navegador.
 */
export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const importAnalysis = useAnalysisStore((s) => s.importAnalysis);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Permitir volver a seleccionar el mismo archivo más adelante.
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      importAnalysis(text);
    } catch {
      importAnalysis('');
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
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
            d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 13v2.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Importar análisis (JSON)
      </button>
    </>
  );
}
