import type { Availability } from '@/types';

/** Tarjeta de estadística usada en el resumen. */
export function StatCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number | string;
  tone?: 'neutral' | 'warn' | 'danger' | 'ok' | 'brand';
}) {
  const toneClass = {
    neutral: 'text-ink',
    warn: 'text-warn',
    danger: 'text-danger',
    ok: 'text-ok',
    brand: 'text-brand',
  }[tone];

  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className={`font-display text-2xl font-semibold tabular ${toneClass}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

const AVAILABILITY_META: Record<
  Availability,
  { label: string; className: string }
> = {
  available: { label: 'Disponible', className: 'bg-ok-soft text-ok' },
  deleted: { label: 'Eliminado', className: 'bg-danger-soft text-danger' },
  private: { label: 'Privado', className: 'bg-warn-soft text-warn' },
  unavailable: {
    label: 'No disponible',
    className: 'bg-danger-soft text-danger',
  },
};

/** Etiqueta de estado de disponibilidad de un video. */
export function AvailabilityBadge({ value }: { value: Availability }) {
  const meta = AVAILABILITY_META[value];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

/** Indicador de que el resultado proviene de la caché local. */
export function CachePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-ink">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
      Desde caché local
    </span>
  );
}

/** Estado vacío reutilizable. */
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface/60 px-4 py-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}
