/**
 * Tipos del dominio compartidos por toda la aplicación.
 * Mantener este archivo libre de lógica para que sirva como contrato estable.
 */

/** Estado de disponibilidad detectado para un video de la playlist. */
export type Availability = 'available' | 'deleted' | 'private' | 'unavailable';

/** Un elemento individual de la playlist, ya normalizado para uso interno. */
export interface PlaylistVideo {
  /** ID del video de YouTube. */
  videoId: string;
  /** Título original tal como lo reporta la API. */
  title: string;
  /** Título "limpio" (canción) usado para normalizar. Solo interno. */
  songTitle: string;
  /** Título normalizado de la canción. */
  normalizedTitle: string;
  /** Artista mostrado (mejor estimación), en su forma original. */
  artist: string | null;
  /** Artista normalizado, usado en la clave de duplicados. */
  normalizedArtist: string;
  /** Clave compuesta (título + artista) usada para agrupar duplicados. */
  dedupKey: string;
  /**
   * Título que el video tenía en un análisis previo (recuperado de la caché)
   * cuando ahora aparece como eliminado/privado. `null` si no se conoce.
   */
  previousTitle: string | null;
  /** URL pública del video. */
  url: string;
  /** URL de la miniatura (cuando existe). */
  thumbnail: string | null;
  /** Canal/propietario reportado (cuando existe). */
  channelTitle: string | null;
  /** Posición dentro de la playlist (0-based). */
  position: number;
  /** Estado de disponibilidad. */
  availability: Availability;
  /** Motivo legible del estado (vacío para videos disponibles). */
  reason: string;
}

/** Grupo de videos cuya combinación título+artista coincide. */
export interface DuplicateGroup {
  /** Clave de agrupación (título+artista normalizados). */
  key: string;
  /** Etiqueta legible del título (primer título original del grupo). */
  label: string;
  /** Artista mostrado del grupo (cuando se pudo determinar). */
  artist: string | null;
  /** Elementos que pertenecen al grupo. */
  videos: PlaylistVideo[];
}

/** Metadatos generales de la playlist. */
export interface PlaylistInfo {
  playlistId: string;
  title: string;
  channelTitle: string | null;
  /** Cantidad de elementos reportada por la API (puede diferir de los obtenidos). */
  reportedItemCount: number | null;
}

/** Resultado completo de un análisis. */
export interface AnalysisResult {
  info: PlaylistInfo;
  /** Todos los elementos obtenidos de la playlist. */
  videos: PlaylistVideo[];
  /** Grupos de duplicados (sólo entre videos disponibles). */
  duplicates: DuplicateGroup[];
  /** Videos eliminados, privados o no disponibles. */
  unavailable: PlaylistVideo[];
  /** Marca temporal del análisis en formato ISO 8601. */
  analyzedAt: string;
}

/** Registro resumido para el historial. */
export interface HistoryEntry {
  playlistId: string;
  title: string;
  analyzedAt: string;
  totalItems: number;
  totalDuplicateItems: number;
  totalDuplicateGroups: number;
  totalUnavailable: number;
}

/** Códigos de error de la capa de API, mapeados a mensajes legibles. */
export type ApiErrorCode =
  | 'missing-key'
  | 'invalid-input'
  | 'not-found'
  | 'quota-exceeded'
  | 'rate-limit'
  | 'forbidden'
  | 'network'
  | 'unknown';
