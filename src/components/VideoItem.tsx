import type { PlaylistVideo } from '@/types';
import { safeYouTubeUrl } from '@/lib/utils/sanitize';
import { AvailabilityBadge } from './primitives';

/** Muestra un video: miniatura, título original, ID y enlace. */
export function VideoItem({
  video,
  showBadge = false,
}: {
  video: PlaylistVideo;
  showBadge?: boolean;
}) {
  const url = safeYouTubeUrl(video.url);
  const thumb = safeYouTubeUrl(video.thumbnail);

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-paper">
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
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink" title={video.title}>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-ink hover:underline"
            >
              {video.title}
            </a>
          ) : (
            video.title
          )}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
          <span className="font-mono">{video.videoId || '—'}</span>
          {showBadge && <AvailabilityBadge value={video.availability} />}
          {showBadge && video.reason && <span>· {video.reason}</span>}
        </p>
      </div>
    </li>
  );
}
