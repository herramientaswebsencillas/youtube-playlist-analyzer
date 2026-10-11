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
/** Sin timeout, `fetch` puede esperar indefinidamente y dejar la UI cargando. */
const REQUEST_TIMEOUT_MS = 20_000;
/** Espera base antes del único reintento ante `rate-limit` (se le suma jitter). */
const RATE_LIMIT_RETRY_DELAY_MS = 2_000;
/**
 * Lotes de `videos.list` en vuelo a la vez. Pocos, para no rozar el límite
 * por segundo de la API, pero suficientes para no esperar uno tras otro en
 * playlists de miles de elementos.
 */
const VIDEO_BATCH_CONCURRENCY = 4;

/** Opciones comunes a las llamadas a la API. */
export interface RequestOptions {
  /** Cancela las peticiones pendientes (p. ej. al descartar el análisis). */
  signal?: AbortSignal;
}

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
    status === 403 ||
    // Una clave inexistente llega como 400 "badRequest" con este mensaje.
    (status === 400 && /api key not valid/i.test(message))
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

function isTimeout(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'TimeoutError';
}

function timeoutError(): YouTubeApiError {
  return new YouTubeApiError(
    'network',
    'La API tardó demasiado en responder. Intenta de nuevo.',
  );
}

/** Ejecuta una única petición GET a la API y devuelve el JSON tipado. */
async function apiGetOnce<T extends YtErrorBody>(
  path: string,
  params: Record<string, string>,
  options: RequestOptions,
): Promise<T> {
  options.signal?.throwIfAborted();
  const search = new URLSearchParams({ ...params, key: getApiKey() });
  const requestUrl = `${API_BASE}/${path}?${search.toString()}`;
  // El timeout cubre también la lectura del cuerpo.
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = options.signal
    ? AbortSignal.any([timeout, options.signal])
    : timeout;

  let response: Response;
  try {
    response = await fetch(requestUrl, { method: 'GET', signal });
  } catch (err) {
    // Una cancelación pedida por quien llama se propaga tal cual.
    options.signal?.throwIfAborted();
    if (isTimeout(err)) throw timeoutError();
    throw new YouTubeApiError(
      'network',
      'No se pudo conectar con la API. Revisa tu conexión a internet.',
    );
  }

  let body: T;
  try {
    body = (await response.json()) as T;
  } catch (err) {
    options.signal?.throwIfAborted();
    if (isTimeout(err)) throw timeoutError();
    throw new YouTubeApiError('unknown', 'Respuesta inesperada de la API.');
  }

  if (!response.ok || body.error) {
    throw mapApiError(response.status, body);
  }
  return body;
}

/**
 * Ejecuta una petición GET con un único reintento ante `rate-limit`: es un
 * límite por segundo, así que suele bastar con esperar un poco. Las lecturas
 * son idempotentes; la cuota diaria agotada no se reintenta.
 */
async function apiGet<T extends YtErrorBody>(
  path: string,
  params: Record<string, string>,
  options: RequestOptions = {},
): Promise<T> {
  try {
    return await apiGetOnce<T>(path, params, options);
  } catch (err) {
    if (!(err instanceof YouTubeApiError) || err.code !== 'rate-limit') {
      throw err;
    }
    const delay = RATE_LIMIT_RETRY_DELAY_MS * (1 + Math.random());
    await new Promise((resolve) => setTimeout(resolve, delay));
    return apiGetOnce<T>(path, params, options);
  }
}

/** Obtiene los metadatos de la playlist. Lanza `not-found` si no existe. */
export async function fetchPlaylistInfo(
  playlistId: string,
  options: RequestOptions = {},
) {
  const data = await apiGet<YtPlaylistListResponse>(
    'playlists',
    {
      part: 'snippet,contentDetails',
      id: playlistId,
      maxResults: '1',
    },
    options,
  );

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
  options: RequestOptions = {},
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

    const data = await apiGet<YtPlaylistItemsResponse>(
      'playlistItems',
      params,
      options,
    );
    if (data.items) items.push(...data.items);

    pageToken = data.nextPageToken;
    pages += 1;
  } while (pageToken && pages < MAX_PAGES);

  return items;
}

/**
 * Verifica qué IDs de video existen realmente y devuelve sus datos
 * (estado, snippet con descripción/canal y temas). Los IDs ausentes en la
 * respuesta corresponden a videos eliminados o inaccesibles. Se consulta en
 * lotes de hasta 50, varios a la vez. Incluir más `part` no incrementa el
 * costo de cuota.
 */
export async function fetchVideoStatuses(
  videoIds: string[],
  options: RequestOptions = {},
): Promise<Map<string, YtVideo>> {
  const result = new Map<string, YtVideo>();
  const unique = Array.from(new Set(videoIds.filter(Boolean)));

  const batches: string[][] = [];
  for (let i = 0; i < unique.length; i += MAX_PAGE_SIZE) {
    batches.push(unique.slice(i, i + MAX_PAGE_SIZE));
  }

  let next = 0;
  // Tras el primer error, el resto de trabajadores no toma lotes nuevos:
  // el análisis ya falló y seguir solo gastaría cuota.
  let failed = false;
  async function worker(): Promise<void> {
    while (!failed && next < batches.length) {
      const batch = batches[next] ?? [];
      next += 1;
      try {
        const data = await apiGet<YtVideosResponse>(
          'videos',
          {
            part: 'snippet,status,topicDetails',
            id: batch.join(','),
            maxResults: String(MAX_PAGE_SIZE),
          },
          options,
        );
        for (const video of data.items ?? []) {
          result.set(video.id, video);
        }
      } catch (err) {
        failed = true;
        throw err;
      }
    }
  }

  const workers = Math.min(VIDEO_BATCH_CONCURRENCY, batches.length);
  await Promise.all(Array.from({ length: workers }, worker));
  return result;
}
