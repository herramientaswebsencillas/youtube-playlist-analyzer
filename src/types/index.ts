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
  /** Título normalizado usado para detectar duplicados. */
  normalizedTitle: string;
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

/** Grupo de videos cuyo título normalizado coincide. */
export interface DuplicateGroup {
  /** Título normalizado que comparten los elementos. */
  normalizedTitle: string;
  /** Etiqueta legible para mostrar (primer título original del grupo). */
  label: string;
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
