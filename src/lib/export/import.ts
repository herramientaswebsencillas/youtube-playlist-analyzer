/**
 * Importación de análisis previamente exportados (JSON).
 *
 * Reconstruye un `AnalysisResult` válido a partir del archivo, rellenando
 * campos faltantes (compatibilidad con exportaciones antiguas) y recalculando
 * duplicados y no disponibles con la lógica actual. El objetivo principal es
 * repoblar la caché para recuperar títulos de videos eliminados aunque se
 * hayan borrado los datos del navegador.
 */

import type {
  AnalysisResult,
  Availability,
  PlaylistInfo,
  PlaylistVideo,
} from '@/types';
import { videoUrl } from '@/lib/utils/sanitize';
import {
  buildDedupKey,
  normalizeArtist,
  normalizeTitle,
} from '@/lib/analysis/normalize';
import { findDuplicates } from '@/lib/analysis/duplicates';

const AVAILABILITIES: Availability[] = [
  'available',
  'deleted',
  'private',
  'unavailable',
];

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
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
 * Convierte el texto de un archivo exportado en un `AnalysisResult`.
 * Acepta tanto el envoltorio de exportación (`{ playlist, videos, ... }`)
 * como un `AnalysisResult` crudo (`{ info, videos, ... }`).
 * Lanza `Error` con un mensaje legible si el contenido no es válido.
 */
export function parseImportedAnalysis(text: string): AnalysisResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }

  const root = asRecord(parsed);
  if (!root) {
    throw new Error('Formato de archivo no reconocido.');
  }

  const infoSource = asRecord(root.info) ?? asRecord(root.playlist);
  if (!infoSource) {
    throw new Error('El archivo no incluye la información de la playlist.');
  }
  const info = parseInfo(infoSource);

  const rawVideos = Array.isArray(root.videos) ? root.videos : [];
  if (rawVideos.length === 0) {
    throw new Error('El archivo no contiene elementos de la playlist.');
  }
  const videos = rawVideos.map(parseVideo);

  // Recalcular con la lógica actual para mantener consistencia.
  const duplicates = findDuplicates(videos);
  const unavailable = videos.filter((v) => v.availability !== 'available');
  const analyzedAt = asString(root.analyzedAt) ?? new Date().toISOString();

  return { info, videos, duplicates, unavailable, analyzedAt };
}
