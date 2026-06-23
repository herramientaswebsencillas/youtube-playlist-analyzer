/**
 * Normalización de títulos para la detección de duplicados.
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
  // (...) [...] {...} que contengan alguna keyword como palabra completa.
  const groupPattern = new RegExp(
    `[([{][^)\\]}]*\\b(?:${keywordAlt})\\b[^)\\]}]*[)\\]}]`,
    'gi',
  );
  return title.replace(groupPattern, ' ');
}

/**
 * Elimina tokens de ruido que aparecen al final del título (p. ej. "... HD",
 * "... Remastered"), incluyendo separadores previos como `-` o `|`.
 * Es conservador: sólo recorta al final para no romper títulos donde la
 * palabra forma parte legítima del nombre (p. ej. "Live and Let Die").
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
 * Normaliza un título: elimina etiquetas, símbolos irrelevantes, acentos y
 * diferencias de mayúsculas/espaciado. El resultado se usa como clave de
 * agrupación de duplicados (no para mostrar).
 */
export function normalizeTitle(
  rawTitle: string,
  config: NormalizationConfig = NORMALIZATION_CONFIG,
): string {
  let title = rawTitle ?? '';

  title = stripTagGroups(title, config.tagKeywords);
  title = stripTrailingTags(title, config.tagKeywords);

  if (config.stripDiacritics) {
    title = removeDiacritics(title);
  }
  if (config.caseInsensitive) {
    title = title.toLowerCase();
  }

  // Sustituye cualquier carácter que no sea alfanumérico por un espacio.
  title = title.replace(/[^\p{L}\p{N}]+/gu, ' ');
  // Colapsa espacios duplicados y recorta extremos.
  title = title.replace(/\s+/g, ' ').trim();

  return title;
}
