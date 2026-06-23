/**
 * Cliente de la YouTube Data API v3 (lado del cliente / navegador).
 *
 * Responsabilidades:
 *  - Construir y ejecutar las llamadas a la API.
 *  - Paginar automáticamente los elementos de la playlist.
 *  - Verificar la disponibilidad real de cada video por lotes.
 *  - Traducir errores de la API a códigos manejables por la UI.
 *
 * No contiene lógica de presentación ni de análisis (normalización/duplicados).
 */

import type { ApiErrorCode } from '@/types';
import type {
  YtErrorBody,
  YtPlaylistItem,
  YtPlaylistItemsResponse,
  YtPlaylistListResponse,
  YtVideo,
  YtVideosResponse,
} from './types';

const API_BASE = 'https://www.googleapis.com/youtube/v3';
const MAX_PAGE_SIZE = 50;
/** Tope defensivo: evita bucles infinitos de paginación. */
const MAX_PAGES = 200;

/** Error tipado que la UI puede mapear a un mensaje claro. */
export class YouTubeApiError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'YouTubeApiError';
    this.code = code;
  }
}

function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!key) {
    throw new YouTubeApiError(
      'missing-key',
      'Falta configurar NEXT_PUBLIC_YOUTUBE_API_KEY.',
    );
  }
  return key;
}

/** Traduce el cuerpo de error de la API a un código interno. */
function mapApiError(status: number, body: YtErrorBody): YouTubeApiError {
  const reason = body.error?.errors?.[0]?.reason ?? '';
  const message = body.error?.message ?? 'Error desconocido de la API.';

  if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
    return new YouTubeApiError(
      'quota-exceeded',
      'Se agotó la cuota diaria de la YouTube Data API.',
    );
  }
  if (reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded') {
    return new YouTubeApiError(
      'rate-limit',
      'Se alcanzó el límite de solicitudes por segundo. Intenta de nuevo en unos momentos.',
    );
  }
  if (
    reason === 'keyInvalid' ||
    reason === 'forbidden' ||
    reason === 'ipRefererBlocked' ||
    status === 403
  ) {
    return new YouTubeApiError(
      'forbidden',
      'La clave de API fue rechazada. Revisa que sea válida y que el dominio esté permitido en sus restricciones.',
    );
  }
  if (reason === 'playlistNotFound' || status === 404) {
    return new YouTubeApiError(
      'not-found',
      'No se encontró la playlist. Verifica que el ID sea correcto y que la playlist sea pública.',
    );
  }
  return new YouTubeApiError('unknown', message);
}

/** Ejecuta una petición GET a la API y devuelve el JSON tipado. */
async function apiGet<T extends YtErrorBody>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const search = new URLSearchParams({ ...params, key: getApiKey() });
  const requestUrl = `${API_BASE}/${path}?${search.toString()}`;

  let response: Response;
  try {
    response = await fetch(requestUrl, { method: 'GET' });
  } catch {
    throw new YouTubeApiError(
      'network',
      'No se pudo conectar con la API. Revisa tu conexión a internet.',
    );
  }

  let body: T;
  try {
    body = (await response.json()) as T;
  } catch {
    throw new YouTubeApiError('unknown', 'Respuesta inesperada de la API.');
  }

  if (!response.ok || body.error) {
    throw mapApiError(response.status, body);
  }
  return body;
}

/** Obtiene los metadatos de la playlist. Lanza `not-found` si no existe. */
export async function fetchPlaylistInfo(playlistId: string) {
  const data = await apiGet<YtPlaylistListResponse>('playlists', {
    part: 'snippet,contentDetails',
    id: playlistId,
    maxResults: '1',
  });

  const playlist = data.items?.[0];
  if (!playlist) {
    throw new YouTubeApiError(
      'not-found',
      'No se encontró la playlist. Verifica que el ID sea correcto y que la playlist sea pública.',
    );
  }

  return {
    playlistId,
    title: playlist.snippet?.title ?? 'Playlist sin título',
    channelTitle: playlist.snippet?.channelTitle ?? null,
    reportedItemCount: playlist.contentDetails?.itemCount ?? null,
  };
}

/** Obtiene todos los elementos de la playlist, recorriendo todas las páginas. */
export async function fetchAllPlaylistItems(
  playlistId: string,
): Promise<YtPlaylistItem[]> {
  const items: YtPlaylistItem[] = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const params: Record<string, string> = {
      part: 'snippet,contentDetails,status',
      playlistId,
      maxResults: String(MAX_PAGE_SIZE),
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await apiGet<YtPlaylistItemsResponse>('playlistItems', params);
    if (data.items) items.push(...data.items);

    pageToken = data.nextPageToken;
    pages += 1;
  } while (pageToken && pages < MAX_PAGES);

  return items;
}

/**
 * Verifica qué IDs de video existen realmente y devuelve sus estados.
 * Los IDs ausentes en la respuesta corresponden a videos eliminados o
 * inaccesibles. Se consulta en lotes de hasta 50 para respetar la API.
 */
export async function fetchVideoStatuses(
  videoIds: string[],
): Promise<Map<string, YtVideo>> {
  const result = new Map<string, YtVideo>();
  const unique = Array.from(new Set(videoIds.filter(Boolean)));

  for (let i = 0; i < unique.length; i += MAX_PAGE_SIZE) {
    const batch = unique.slice(i, i + MAX_PAGE_SIZE);
    const data = await apiGet<YtVideosResponse>('videos', {
      part: 'status,contentDetails',
      id: batch.join(','),
      maxResults: String(MAX_PAGE_SIZE),
    });
    for (const video of data.items ?? []) {
      result.set(video.id, video);
    }
  }

  return result;
}
