/**
 * Datos de prueba compartidos por los tests unitarios.
 */

import type { AnalysisResult, PlaylistVideo } from '@/types';
import {
  buildDedupKey,
  normalizeArtist,
  normalizeTitle,
} from '@/lib/analysis/normalize';
import { findDuplicates } from '@/lib/analysis/duplicates';

export const PLAYLIST_ID = 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf';

/** Crea un `PlaylistVideo` coherente a partir de unos pocos campos. */
export function makeVideo(
  overrides: Partial<PlaylistVideo> & { videoId: string; title: string },
): PlaylistVideo {
  const songTitle = overrides.songTitle ?? overrides.title;
  const artist = overrides.artist ?? null;
  const normalizedTitle = normalizeTitle(songTitle);
  const normalizedArtist = normalizeArtist(artist);
  return {
    songTitle,
    normalizedTitle,
    artist,
    normalizedArtist,
    dedupKey: buildDedupKey(normalizedTitle, normalizedArtist),
    previousTitle: null,
    url: `https://www.youtube.com/watch?v=${overrides.videoId}`,
    thumbnail: `https://i.ytimg.com/vi/${overrides.videoId}/mqdefault.jpg`,
    channelTitle: null,
    position: 0,
    availability: 'available',
    reason: '',
    ...overrides,
  };
}

/** Crea un `AnalysisResult` completo con los videos indicados. */
export function makeResult(
  videos: PlaylistVideo[],
  playlistId = PLAYLIST_ID,
): AnalysisResult {
  return {
    info: {
      playlistId,
      title: 'Mi playlist',
      channelTitle: 'Mi canal',
      reportedItemCount: videos.length,
    },
    videos,
    duplicates: findDuplicates(videos),
    unavailable: videos.filter((v) => v.availability !== 'available'),
    analyzedAt: '2026-01-01T00:00:00.000Z',
  };
}
