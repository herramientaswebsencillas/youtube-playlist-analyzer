/**
 * Detección de duplicados.
 *
 * Agrupa elementos por su clave compuesta (título + artista normalizados).
 * Esto evita marcar como repetidas dos canciones con el mismo nombre pero de
 * artistas distintos. Sólo se consideran videos disponibles: los
 * eliminados/privados comparten títulos genéricos que generarían falsos
 * positivos.
 *
 * Lógica desacoplada de la interfaz para permitir mejoras sin afectar la UI.
 */

import type { DuplicateGroup, PlaylistVideo } from '@/types';

/**
 * Devuelve los grupos de duplicados (2 o más videos con la misma clave),
 * preservando el orden de aparición en la playlist.
 */
export function findDuplicates(videos: PlaylistVideo[]): DuplicateGroup[] {
  const groups = new Map<string, PlaylistVideo[]>();

  for (const video of videos) {
    if (video.availability !== 'available') continue;
    if (!video.normalizedTitle) continue;

    const existing = groups.get(video.dedupKey);
    if (existing) {
      existing.push(video);
    } else {
      groups.set(video.dedupKey, [video]);
    }
  }

  const duplicates: DuplicateGroup[] = [];
  for (const [key, items] of groups) {
    if (items.length < 2) continue;
    const first = items[0];
    duplicates.push({
      key,
      label: first?.title ?? key,
      artist: first?.artist ?? null,
      videos: items,
    });
  }

  // Ordena por tamaño de grupo descendente; a igualdad, por etiqueta.
  duplicates.sort((a, b) => {
    if (b.videos.length !== a.videos.length) {
      return b.videos.length - a.videos.length;
    }
    return a.label.localeCompare(b.label);
  });

  return duplicates;
}

/** Cuenta total de elementos involucrados en duplicados. */
export function countDuplicateItems(groups: DuplicateGroup[]): number {
  return groups.reduce((total, group) => total + group.videos.length, 0);
}
