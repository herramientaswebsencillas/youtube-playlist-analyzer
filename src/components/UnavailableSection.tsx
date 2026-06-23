'use client';

import { useAnalysisStore } from '@/store/useAnalysisStore';
import { EmptyState } from './primitives';
import { VideoItem } from './VideoItem';

/** Sección independiente de videos eliminados, privados o no disponibles. */
export function UnavailableSection() {
  const unavailable = useAnalysisStore((s) => s.result?.unavailable ?? []);

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold">Videos no disponibles</h2>
      {unavailable.length === 0 ? (
        <EmptyState>
          Todos los videos de la playlist están disponibles.
        </EmptyState>
      ) : (
        <div className="rounded-xl border border-line bg-surface px-4">
          <ul className="divide-y divide-line">
            {unavailable.map((video, i) => (
              <VideoItem
                key={`${video.videoId || 'novid'}-${i}`}
                video={video}
                showBadge
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
