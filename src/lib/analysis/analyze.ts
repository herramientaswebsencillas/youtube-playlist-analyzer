/**
 * Orquestador del análisis.
 *
 * Combina la capa de red (api.ts), la clasificación de disponibilidad y la
 * detección de duplicados (normalize.ts + duplicates.ts) para producir un
 * `AnalysisResult` completo y serializable.
 */

import type {
  AnalysisResult,
  Availability,
  PlaylistVideo,
} from '@/types';
import {
  fetchAllPlaylistItems,
  fetchPlaylistInfo,
  fetchVideoStatuses,
} from '@/lib/youtube/api';
import type { YtPlaylistItem, YtThumbnails, YtVideo } from '@/lib/youtube/types';
import { videoUrl } from '@/lib/utils/sanitize';
import { normalizeTitle } from './normalize';
import { findDuplicates } from './duplicates';

/** Estados de subida que indican un video accesible. */
const HEALTHY_UPLOAD_STATUSES = new Set(['processed', 'uploaded']);

/** Elige la mejor miniatura disponible. */
function pickThumbnail(thumbnails: YtThumbnails | undefined): string | null {
  if (!thumbnails) return null;
  return (
    thumbnails.medium?.url ??
    thumbnails.default?.url ??
    thumbnails.high?.url ??
    thumbnails.standard?.url ??
    thumbnails.maxres?.url ??
    null
  );
}

interface Classification {
  availability: Availability;
  reason: string;
}

/** Determina el estado de disponibilidad de un elemento de la playlist. */
function classify(
  item: YtPlaylistItem,
  video: YtVideo | undefined,
): Classification {
  const titleLower = (item.snippet?.title ?? '').trim().toLowerCase();
  const itemPrivacy = item.status?.privacyStatus;
  const looksDeleted = titleLower === 'deleted video';
  const looksPrivate = titleLower === 'private video';

  // El video no aparece en videos.list: es inaccesible.
  if (!video) {
    if (itemPrivacy === 'private' || looksPrivate) {
      return { availability: 'private', reason: 'Video privado' };
    }
    if (looksDeleted) {
      return { availability: 'deleted', reason: 'Video eliminado' };
    }
    return {
      availability: 'unavailable',
      reason: 'Video no disponible (eliminado o inaccesible)',
    };
  }

  // El video existe: revisamos su estado declarado.
  if (video.status?.privacyStatus === 'private' || itemPrivacy === 'private') {
    return { availability: 'private', reason: 'Video privado' };
  }

  const uploadStatus = video.status?.uploadStatus;
  if (uploadStatus && !HEALTHY_UPLOAD_STATUSES.has(uploadStatus)) {
    return {
      availability: 'unavailable',
      reason: `Video no disponible (estado: ${uploadStatus})`,
    };
  }

  return { availability: 'available', reason: '' };
}

/** Convierte un elemento crudo de la API en un `PlaylistVideo` del dominio. */
function toPlaylistVideo(
  item: YtPlaylistItem,
  index: number,
  statuses: Map<string, YtVideo>,
): PlaylistVideo {
  const videoId =
    item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId ?? '';
  const title = item.snippet?.title ?? 'Sin título';
  const { availability, reason } = videoId
    ? classify(item, statuses.get(videoId))
    : { availability: 'unavailable' as Availability, reason: 'Sin ID de video' };

  return {
    videoId,
    title,
    normalizedTitle: normalizeTitle(title),
    url: videoId ? videoUrl(videoId) : '',
    thumbnail: pickThumbnail(item.snippet?.thumbnails),
    channelTitle: item.snippet?.videoOwnerChannelTitle ?? null,
    position: item.snippet?.position ?? index,
    availability,
    reason,
  };
}

/**
 * Ejecuta el análisis completo de una playlist a partir de su ID.
 * Lanza `YouTubeApiError` ante fallos de la API.
 */
export async function analyzePlaylist(
  playlistId: string,
): Promise<AnalysisResult> {
  const [info, rawItems] = await Promise.all([
    fetchPlaylistInfo(playlistId),
    fetchAllPlaylistItems(playlistId),
  ]);

  const videoIds = rawItems
    .map(
      (item) =>
        item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId ?? '',
    )
    .filter(Boolean);

  const statuses = await fetchVideoStatuses(videoIds);

  const videos = rawItems.map((item, index) =>
    toPlaylistVideo(item, index, statuses),
  );

  const duplicates = findDuplicates(videos);
  const unavailable = videos.filter((v) => v.availability !== 'available');

  return {
    info,
    videos,
    duplicates,
    unavailable,
    analyzedAt: new Date().toISOString(),
  };
}
