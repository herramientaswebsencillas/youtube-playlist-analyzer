'use client';

import { useAnalysisStore } from '@/store/useAnalysisStore';

/** Campo de entrada de URL/ID y botón para iniciar el análisis. */
export function PlaylistInput() {
  const input = useAnalysisStore((s) => s.input);
  const status = useAnalysisStore((s) => s.status);
  const setInput = useAnalysisStore((s) => s.setInput);
  const analyze = useAnalysisStore((s) => s.analyze);

  const loading = status === 'loading';

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void analyze();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="flex-1">
        <label htmlFor="playlist-input" className="sr-only">
          URL o ID de la playlist
        </label>
        <input
          id="playlist-input"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pega la URL de la playlist o su ID…"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-sm transition placeholder:text-muted/70 focus:border-brand"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Analizando…' : 'Analizar'}
      </button>
    </form>
  );
}
