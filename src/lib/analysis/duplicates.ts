/**
 * Detección de duplicados.
 *
 * Agrupa elementos por su título normalizado. Sólo se consideran videos
 * disponibles: los eliminados/privados comparten títulos genéricos
 * ("Deleted video", "Private video") que generarían falsos positivos.
 *
 * Lógica desacoplada de la interfaz para permitir mejoras sin afectar la UI.
 */

import type { DuplicateGroup, PlaylistVideo } from '@/types';

/**
 * Devuelve los grupos de duplicados (2 o más videos con el mismo título
 * normalizado), preservando el orden de aparición en la playlist.
 */
export function findDuplicates(videos: PlaylistVideo[]): DuplicateGroup[] {
  const groups = new Map<string, PlaylistVideo[]>();

  for (const video of videos) {
    if (video.availability !== 'available') continue;
    if (!video.normalizedTitle) continue;

    const existing = groups.get(video.normalizedTitle);
    if (existing) {
      existing.push(video);
    } else {
      groups.set(video.normalizedTitle, [video]);
    }
  }

  const duplicates: DuplicateGroup[] = [];
  for (const [normalizedTitle, items] of groups) {
    if (items.length < 2) continue;
    duplicates.push({
      normalizedTitle,
      label: items[0]?.title ?? normalizedTitle,
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
