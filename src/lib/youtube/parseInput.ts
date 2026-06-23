/**
 * Detección y validación de la entrada de playlist.
 * Acepta URLs de YouTube, YouTube Music o un ID de playlist directo.
 * Desacoplado de la UI y de la capa de red para facilitar pruebas y cambios.
 */

/** Dominios de YouTube aceptados como origen válido de una URL de playlist. */
const ALLOWED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
]);

/**
 * Un ID de playlist de YouTube usa el alfabeto base64url y suele medir entre
 * 13 y 42 caracteres. Aceptamos ese rango con cierto margen.
 */
const PLAYLIST_ID_PATTERN = /^[A-Za-z0-9_-]{13,42}$/;

export interface ParseSuccess {
  ok: true;
  playlistId: string;
}

export interface ParseFailure {
  ok: false;
  /** Mensaje legible explicando por qué la entrada es inválida. */
  message: string;
}

export type ParseResult = ParseSuccess | ParseFailure;

const INVALID_MESSAGE =
  'Entrada no válida. Pega la URL de una playlist de YouTube o YouTube Music, o su ID.';

/** Indica si una cadena tiene forma de ID de playlist válido. */
export function isPlaylistId(value: string): boolean {
  return PLAYLIST_ID_PATTERN.test(value);
}

/** Normaliza el host eliminando un prefijo `www.` redundante para comparar. */
function hostIsAllowed(hostname: string): boolean {
  return ALLOWED_HOSTS.has(hostname.toLowerCase());
}

/**
 * Extrae y valida el ID de playlist a partir de cualquier entrada admitida.
 * No realiza llamadas de red: sólo análisis sintáctico.
 */
export function parsePlaylistInput(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: 'Ingresa una URL o un ID de playlist.' };
  }

  // Caso 1: el usuario pegó directamente un ID.
  if (isPlaylistId(trimmed)) {
    return { ok: true, playlistId: trimmed };
  }

  // Caso 2: el usuario pegó una URL. Intentamos parsearla.
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, message: INVALID_MESSAGE };
  }

  if (!hostIsAllowed(url.hostname)) {
    return {
      ok: false,
      message: 'La URL no pertenece a YouTube ni a YouTube Music.',
    };
  }

  const listParam = url.searchParams.get('list');
  if (listParam && isPlaylistId(listParam)) {
    return { ok: true, playlistId: listParam };
  }

  if (listParam) {
    return {
      ok: false,
      message: 'El parámetro "list" de la URL no contiene un ID de playlist válido.',
    };
  }

  return {
    ok: false,
    message: 'La URL no contiene una playlist (falta el parámetro "list").',
  };
}
