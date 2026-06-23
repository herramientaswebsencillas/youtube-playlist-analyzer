import type { AppError } from '@/store/useAnalysisStore';

/** Sugerencia accionable según el tipo de error. */
const HINTS: Partial<Record<AppError['code'], string>> = {
  'missing-key':
    'Define NEXT_PUBLIC_YOUTUBE_API_KEY antes de compilar la aplicación.',
  'quota-exceeded':
    'La cuota se reinicia cada día. Mientras tanto puedes consultar análisis previos desde el historial.',
  forbidden:
    'Verifica la clave y, si usas restricciones por dominio (HTTP referrers), que incluya el dominio actual.',
  'rate-limit': 'Espera unos segundos y vuelve a intentarlo.',
};

/** Mensaje de error claro y accionable. */
export function ErrorMessage({ error }: { error: AppError }) {
  const hint = HINTS[error.code];
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      <p className="font-medium">{error.message}</p>
      {hint && <p className="mt-1 text-danger/80">{hint}</p>}
    </div>
  );
}
