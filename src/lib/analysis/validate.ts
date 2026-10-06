/**
 * Reconstrucción defensiva de un `AnalysisResult` a partir de datos sin
 * tipar: un archivo importado o lo que haya en LocalStorage, que no
 * controlamos (otra versión de la app, una extensión u otro sitio del mismo
 * origen en github.io pueden haberlo escrito).
 *
 * Rellena campos faltantes (compatibilidad con exportaciones antiguas) y
 * recalcula duplicados y no disponibles con la lógica actual.
 */

import type {
  AnalysisResult,
  Availability,
  PlaylistInfo,
  PlaylistVideo,
} from '@/types';
import { videoUrl } from '@/lib/utils/sanitize';
import { isPlaylistId } from '@/lib/youtube/parseInput';
import { buildDedupKey, normalizeArtist, normalizeTitle } from './normalize';
import { findDuplicates } from './duplicates';

const AVAILABILITIES: Availability[] = [
  'available',
  'deleted',
  'private',
  'unavailable',
];

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Reconstruye la información general de la playlist. */
function parseInfo(source: Record<string, unknown>): PlaylistInfo {
  const playlistId = asString(source.playlistId);
  const title = asString(source.title);
  if (!playlistId || !title) {
    throw new Error('El archivo no contiene datos válidos de la playlist.');
  }
  // El ID se usa como clave de LocalStorage y en llamadas a la API.
  if (!isPlaylistId(playlistId)) {
    throw new Error('El archivo contiene un ID de playlist no válido.');
  }
  const reported = source.reportedItemCount;
  return {
    playlistId,
    title,
    channelTitle: asString(source.channelTitle),
    reportedItemCount: typeof reported === 'number' ? reported : null,
  };
}

/** Reconstruye un `PlaylistVideo`, rellenando lo que falte. */
function parseVideo(raw: unknown, index: number): PlaylistVideo {
  const v = asRecord(raw) ?? {};
  const videoId = asString(v.videoId) ?? '';
  const title = asString(v.title) ?? 'Sin título';
  const artist = asString(v.artist);
  const songTitle = asString(v.songTitle) ?? title;
  const normalizedTitle =
    asString(v.normalizedTitle) ?? normalizeTitle(songTitle);
  const normalizedArtist =
    asString(v.normalizedArtist) ?? normalizeArtist(artist);
  const availabilityRaw = asString(v.availability) as Availability | null;
  const availability =
    availabilityRaw && AVAILABILITIES.includes(availabilityRaw)
      ? availabilityRaw
      : 'available';
  const position = typeof v.position === 'number' ? v.position : index;

  return {
    videoId,
    title,
    songTitle,
    normalizedTitle,
    artist,
    normalizedArtist,
    dedupKey:
      asString(v.dedupKey) ?? buildDedupKey(normalizedTitle, normalizedArtist),
    previousTitle: asString(v.previousTitle),
    url: asString(v.url) ?? (videoId ? videoUrl(videoId) : ''),
    thumbnail: asString(v.thumbnail),
    channelTitle: asString(v.channelTitle),
    position,
    availability,
    reason: asString(v.reason) ?? '',
  };
}

/**
 * Convierte un objeto sin tipar en un `AnalysisResult` válido.
 * Acepta tanto el envoltorio de exportación (`{ playlist, videos, ... }`)
 * como un `AnalysisResult` crudo (`{ info, videos, ... }`).
 * Lanza `Error` con un mensaje legible si el contenido no es válido.
 */
export function toAnalysisResult(value: unknown): AnalysisResult {
  const root = asRecord(value);
  if (!root) {
    throw new Error('Formato de archivo no reconocido.');
  }

  const infoSource = asRecord(root.info) ?? asRecord(root.playlist);
  if (!infoSource) {
    throw new Error('El archivo no incluye la información de la playlist.');
  }
  const info = parseInfo(infoSource);

  const rawVideos = Array.isArray(root.videos) ? root.videos : [];
  const videos = rawVideos.map(parseVideo);

  // Recalcular con la lógica actual para mantener consistencia.
  const duplicates = findDuplicates(videos);
  const unavailable = videos.filter((v) => v.availability !== 'available');
  const analyzedAt = asString(root.analyzedAt) ?? new Date().toISOString();

  return { info, videos, duplicates, unavailable, analyzedAt };
}
