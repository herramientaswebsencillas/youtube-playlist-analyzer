import type { PlaylistVideo } from '@/types';
import { safeYouTubeUrl } from '@/lib/utils/sanitize';
import { AvailabilityBadge } from './primitives';

const PLACEHOLDER_TITLES = new Set(['deleted video', 'private video']);

/** Muestra un video: miniatura, título, artista, posición e ID. */
export function VideoItem({
  video,
  showBadge = false,
}: {
  video: PlaylistVideo;
  showBadge?: boolean;
}) {
  const url = safeYouTubeUrl(video.url);
  const thumb = safeYouTubeUrl(video.thumbnail);

  const isPlaceholder = PLACEHOLDER_TITLES.has(video.title.trim().toLowerCase());
  const recovered = isPlaceholder && video.previousTitle;
  const displayTitle = recovered ? video.previousTitle! : video.title;

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-paper">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- export estático sin optimización de imágenes
          <img
            src={thumb}
            alt=""
            width={80}
            height={48}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
            sin miniatura
          </div>
        )}
        <span className="absolute bottom-0 left-0 rounded-tr bg-ink/70 px-1 text-[10px] font-medium text-white tabular">
          #{video.position + 1}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink" title={displayTitle}>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-ink hover:underline"
            >
              {displayTitle}
            </a>
          ) : (
            displayTitle
          )}
        </p>

        {recovered && (
          <p className="text-[11px] italic text-muted">
            Título recuperado de un análisis previo.
          </p>
        )}

        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
          {video.artist && (
            <span className="font-medium text-ink/70">{video.artist}</span>
          )}
          <span className="font-mono">{video.videoId || '—'}</span>
          {showBadge && <AvailabilityBadge value={video.availability} />}
          {showBadge && video.reason && <span>· {video.reason}</span>}
        </p>
      </div>
    </li>
  );
}
