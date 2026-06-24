/**
 * Orquestador del análisis.
 *
 * Combina la capa de red (api.ts), la clasificación de disponibilidad, la
 * extracción de artista y la detección de duplicados para producir un
 * `AnalysisResult` completo y serializable.
 *
 * Recibe opcionalmente el análisis previo (desde la caché) para recuperar el
 * título de videos que ahora aparecen como eliminados/privados.
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
import {
  buildDedupKey,
  deriveTrackMeta,
  normalizeArtist,
  normalizeTitle,
} from './normalize';
import { findDuplicates } from './duplicates';

/** Estados de subida que indican un video accesible. */
const HEALTHY_UPLOAD_STATUSES = new Set(['processed', 'uploaded']);

/** Títulos placeholder que no aportan información real. */
const PLACEHOLDER_TITLES = new Set(['deleted video', 'private video']);

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
  previousById: Map<string, PlaylistVideo>,
): PlaylistVideo {
  const videoId =
    item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId ?? '';
  const video = videoId ? statuses.get(videoId) : undefined;
  const rawTitle = item.snippet?.title ?? 'Sin título';

  const { availability, reason } = videoId
    ? classify(item, video)
    : { availability: 'unavailable' as Availability, reason: 'Sin ID de video' };

  // Fuentes para artista/canción: preferimos el snippet de videos.list.
  const channelTitle =
    video?.snippet?.channelTitle ??
    item.snippet?.videoOwnerChannelTitle ??
    null;
  const description = video?.snippet?.description ?? null;

  const meta = deriveTrackMeta({ title: rawTitle, channelTitle, description });
  let artist = meta.artist;
  let songTitle = meta.title;

  // Recuperación desde la caché para videos ahora inaccesibles.
  let previousTitle: string | null = null;
  if (availability !== 'available') {
    const prev = previousById.get(videoId);
    if (prev) {
      const prevLower = prev.title.trim().toLowerCase();
      if (!PLACEHOLDER_TITLES.has(prevLower)) {
        previousTitle = prev.title;
      }
      if (!artist && prev.artist) artist = prev.artist;
      if (PLACEHOLDER_TITLES.has(rawTitle.trim().toLowerCase()) && previousTitle) {
        songTitle = previousTitle;
      }
    }
  }

  const normalizedTitle = normalizeTitle(songTitle);
  const normalizedArtist = normalizeArtist(artist);

  return {
    videoId,
    title: rawTitle,
    songTitle,
    normalizedTitle,
    artist,
    normalizedArtist,
    dedupKey: buildDedupKey(normalizedTitle, normalizedArtist),
    previousTitle,
    url: videoId ? videoUrl(videoId) : '',
    thumbnail: pickThumbnail(item.snippet?.thumbnails),
    channelTitle,
    position: item.snippet?.position ?? index,
    availability,
    reason,
  };
}

/**
 * Ejecuta el análisis completo de una playlist a partir de su ID.
 * `previous` es el análisis anterior (caché) usado para recuperar títulos.
 * Lanza `YouTubeApiError` ante fallos de la API.
 */
export async function analyzePlaylist(
  playlistId: string,
  previous?: AnalysisResult | null,
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

  const previousById = new Map<string, PlaylistVideo>();
  for (const prev of previous?.videos ?? []) {
    if (prev.videoId) previousById.set(prev.videoId, prev);
  }

  const videos = rawItems.map((item, index) =>
    toPlaylistVideo(item, index, statuses, previousById),
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
