/** Indicador de carga mostrado durante el análisis. */
export function LoadingIndicator() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-4 text-sm text-muted shadow-card"
    >
      <span
        aria-hidden
        className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent"
      />
      Analizando la playlist… obteniendo elementos y verificando disponibilidad.
    </div>
  );
}
