/**
 * Normalización de títulos y extracción/normalización de artistas para la
 * detección de duplicados.
 *
 * Diseñada de forma desacoplada y configurable: la lista de patrones vive en
 * `NORMALIZATION_CONFIG`, de modo que se puede ajustar sin tocar el algoritmo.
 */

export interface NormalizationConfig {
  /**
   * Palabras/frases consideradas "ruido" de etiquetado. Se eliminan cuando
   * aparecen dentro de paréntesis/corchetes o como token final del título.
   */
  tagKeywords: string[];
  /** Si es `true`, se eliminan acentos/diacríticos. */
  stripDiacritics: boolean;
  /** Si es `true`, se ignoran mayúsculas/minúsculas. */
  caseInsensitive: boolean;
}

export const NORMALIZATION_CONFIG: NormalizationConfig = {
  tagKeywords: [
    'official video',
    'official audio',
    'official music video',
    'official lyric video',
    'official lyrics video',
    'lyric video',
    'lyrics',
    'letra',
    'con letra',
    'audio oficial',
    'video oficial',
    'música oficial',
    'musica oficial',
    'remastered',
    'remaster',
    'remasterizado',
    'remasterizada',
    'live',
    'en vivo',
    'en directo',
    'visualizer',
    'audio',
    'hd',
    'hq',
    'full hd',
    '4k',
    '8k',
    'mv',
  ],
  stripDiacritics: true,
  caseInsensitive: true,
};

/** Escapa una cadena para usarla literalmente dentro de un RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Elimina grupos entre paréntesis/corchetes/llaves cuyo contenido incluya
 * alguna de las palabras clave de etiquetado.
 */
function stripTagGroups(title: string, keywords: string[]): string {
  const keywordAlt = keywords.map(escapeRegExp).join('|');
  const groupPattern = new RegExp(
    `[([{][^)\\]}]*\\b(?:${keywordAlt})\\b[^)\\]}]*[)\\]}]`,
    'gi',
  );
  return title.replace(groupPattern, ' ');
}

/**
 * Elimina tokens de ruido que aparecen al final del título (p. ej. "... HD",
 * "... Remastered"), incluyendo separadores previos como `-` o `|`.
 */
function stripTrailingTags(title: string, keywords: string[]): string {
  const keywordAlt = keywords.map(escapeRegExp).join('|');
  const trailingPattern = new RegExp(
    `(?:\\s*[-|/–—]\\s*|\\s+)(?:${keywordAlt})\\s*$`,
    'i',
  );
  let current = title;
  let previous: string;
  do {
    previous = current;
    current = current.replace(trailingPattern, '').trimEnd();
  } while (current !== previous);
  return current;
}

/** Elimina diacríticos (acentos) preservando la letra base. */
function removeDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/**
 * Normaliza un título de canción: elimina etiquetas, símbolos irrelevantes,
 * acentos y diferencias de mayúsculas/espaciado. El resultado se usa como
 * parte de la clave de agrupación de duplicados (no para mostrar).
 */
export function normalizeTitle(
  rawTitle: string,
  config: NormalizationConfig = NORMALIZATION_CONFIG,
): string {
  let title = rawTitle ?? '';

  title = stripTagGroups(title, config.tagKeywords);
  title = stripTrailingTags(title, config.tagKeywords);

  if (config.stripDiacritics) title = removeDiacritics(title);
  if (config.caseInsensitive) title = title.toLowerCase();

  title = title.replace(/[^\p{L}\p{N}]+/gu, ' ');
  title = title.replace(/\s+/g, ' ').trim();

  return title;
}

/**
 * Normaliza un nombre de artista para compararlo: quita sufijos típicos
 * ("- Topic", "VEVO"), acentos, mayúsculas y símbolos.
 */
export function normalizeArtist(
  artist: string | null | undefined,
  config: NormalizationConfig = NORMALIZATION_CONFIG,
): string {
  if (!artist) return '';
  let value = artist;
  value = value.replace(/\s*-\s*topic\s*$/i, '');
  value = value.replace(/vevo\s*$/i, '');
  if (config.stripDiacritics) value = removeDiacritics(value);
  if (config.caseInsensitive) value = value.toLowerCase();
  value = value.replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
  return value;
}

/* ------------------------------------------------------------------ */
/*  Extracción de artista + canción                                    */
/* ------------------------------------------------------------------ */

export interface TrackMeta {
  /** Título de la canción (mejor estimación, en su forma original). */
  title: string;
  /** Artista (mejor estimación, en su forma original) o `null`. */
  artist: string | null;
}

const PROVIDED_BY = /provided to youtube by/i;
const MIDDLE_DOT = '·';

/**
 * Extrae canción + artista del bloque autogenerado de los Art Tracks:
 *   Provided to YouTube by <distribuidor>
 *
 *   <Canción> · <Artista> · <Artista 2>
 *
 *   <Álbum>
 */
function fromDescription(description?: string | null): TrackMeta | null {
  if (!description) return null;
  const lines = description.split('\n').map((l) => l.trim());
  const start = lines.findIndex((l) => PROVIDED_BY.test(l));
  if (start === -1) return null;

  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    if (line.includes(MIDDLE_DOT)) {
      const parts = line
        .split(MIDDLE_DOT)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        const [song, ...artists] = parts;
        return { title: song ?? '', artist: artists.join(', ') };
      }
    }
    // La primera línea no vacía no tiene el formato esperado: abandonamos.
    break;
  }
  return null;
}

/** Si el canal es "Artista - Topic", devuelve el artista (canción = título). */
function fromTopicChannel(
  title: string,
  channelTitle?: string | null,
): TrackMeta | null {
  if (!channelTitle) return null;
  const match = channelTitle.match(/^(.*?)\s*-\s*topic\s*$/i);
  if (!match || !match[1]) return null;
  return { title, artist: match[1].trim() };
}

/**
 * Interpreta el patrón "Artista - Canción". Conservador: ignora el caso en
 * que el lado derecho es sólo una etiqueta (p. ej. "Live", "Remastered").
 */
function fromTitlePattern(
  title: string,
  config: NormalizationConfig,
): TrackMeta | null {
  const match = title.match(/^(.{1,80}?)\s+[-–—]\s+(.+)$/);
  if (!match || !match[1] || !match[2]) return null;
  const right = match[2].trim();
  const rightNorm = normalizeTitle(right, config);
  // Evita partir "X - Live" / "X - Remastered" tomando la etiqueta como canción.
  if (!rightNorm) return null;
  if (config.tagKeywords.includes(rightNorm)) return null;
  return { artist: match[1].trim(), title: right };
}

/**
 * Determina canción + artista combinando, por prioridad de fiabilidad:
 *   1) Bloque "Provided to YouTube by" de la descripción (música oficial).
 *   2) Canal "Artista - Topic".
 *   3) Patrón "Artista - Canción" en el título.
 *   4) Fallback: el canal como artista y el título tal cual.
 */
export function deriveTrackMeta(
  input: {
    title: string;
    channelTitle?: string | null;
    description?: string | null;
  },
  config: NormalizationConfig = NORMALIZATION_CONFIG,
): TrackMeta {
  const title = input.title ?? '';
  return (
    fromDescription(input.description) ??
    fromTopicChannel(title, input.channelTitle) ??
    fromTitlePattern(title, config) ?? {
      title,
      artist: input.channelTitle ?? null,
    }
  );
}

/** Construye la clave de duplicados a partir de título y artista normalizados. */
export function buildDedupKey(
  normalizedTitle: string,
  normalizedArtist: string,
): string {
  return normalizedArtist
    ? `${normalizedTitle}|@|${normalizedArtist}`
    : normalizedTitle;
}
