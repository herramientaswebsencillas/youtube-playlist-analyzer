/**
 * Utilidades de saneamiento.
 *
 * React escapa automáticamente el texto al renderizar, pero no valida los
 * atributos `href`/`src`: las URLs que llegan de la API o de un archivo
 * importado deben pasar por `safeYouTubeUrl` antes de usarse.
 */

/** Hosts permitidos para enlaces y miniaturas provenientes de la API. */
const SAFE_URL_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'i.ytimg.com',
  'img.youtube.com',
  'yt3.ggpht.com',
];

/**
 * Devuelve la URL sólo si usa http(s) y apunta a un host de YouTube conocido.
 * En cualquier otro caso devuelve `null` para no renderizar contenido dudoso.
 */
export function safeYouTubeUrl(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const host = url.hostname.toLowerCase();
    const allowed = SAFE_URL_HOSTS.some(
      (safe) => host === safe || host.endsWith(`.${safe}`),
    );
    return allowed ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Construye la URL pública de un video a partir de su ID. */
export function videoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

/** Construye la URL pública de una playlist a partir de su ID. */
export function playlistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
}
