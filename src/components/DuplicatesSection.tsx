'use client';

import { useState } from 'react';
import type { DuplicateGroup } from '@/types';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { EmptyState } from './primitives';
import { VideoItem } from './VideoItem';

/** Un grupo de duplicados, expandible/colapsable. */
function Group({
  group,
  defaultOpen,
}: {
  group: DuplicateGroup;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `dup-${group.key.replace(/[^a-z0-9]+/gi, '-')}`;

  return (
    <div className="rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink" title={group.label}>
            {group.label}
          </span>
          <span className="flex flex-wrap items-center gap-x-2 text-xs">
            {group.artist && (
              <span className="text-ink/60">{group.artist}</span>
            )}
            <span className="text-warn">
              {group.videos.length} elementos repetidos
            </span>
          </span>
        </span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul id={panelId} className="divide-y divide-line border-t border-line px-4">
          {group.videos.map((video, i) => (
            <VideoItem key={`${video.videoId}-${i}`} video={video} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Sección de canciones repetidas, agrupadas por título + artista. */
export function DuplicatesSection() {
  const duplicates = useAnalysisStore((s) => s.result?.duplicates ?? []);

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold">Canciones repetidas</h2>
      {duplicates.length === 0 ? (
        <EmptyState>No se detectaron canciones repetidas en esta playlist.</EmptyState>
      ) : (
        <div className="space-y-3">
          {duplicates.map((group, index) => (
            <Group key={group.key} group={group} defaultOpen={index === 0} />
          ))}
        </div>
      )}
    </section>
  );
}
