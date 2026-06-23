/**
 * Exportación a JSON con toda la información obtenida y procesada.
 */

import type { AnalysisResult } from '@/types';

export function toJson(result: AnalysisResult): string {
  const payload = {
    generatedBy: 'YouTube Playlist Analyzer',
    schemaVersion: 1,
    playlist: result.info,
    analyzedAt: result.analyzedAt,
    totals: {
      items: result.videos.length,
      duplicateGroups: result.duplicates.length,
      duplicateItems: result.duplicates.reduce(
        (sum, group) => sum + group.videos.length,
        0,
      ),
      unavailable: result.unavailable.length,
    },
    duplicates: result.duplicates,
    unavailable: result.unavailable,
    videos: result.videos,
  };
  return JSON.stringify(payload, null, 2);
}
