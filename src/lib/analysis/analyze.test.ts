import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeResult, makeVideo, PLAYLIST_ID } from '@/lib/testing/fixtures';
import { YouTubeApiError } from '@/lib/youtube/api';
import { analyzePlaylist } from './analyze';

type Routes = Record<string, (params: URLSearchParams) => unknown>;

/** Simula `fetch` respondiendo según el recurso de la API solicitado. */
function mockApi(routes: Routes, status = 200) {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const url = new URL(String(input));
    const resource = url.pathname.split('/').pop() ?? '';
    const handler = routes[resource];
    if (!handler) throw new Error(`Ruta no simulada: ${resource}`);
    const body = handler(url.searchParams);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as unknown as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function item(videoId: string, title: string, position: number) {
  return {
    id: `item-${videoId}`,
    snippet: { title, position, resourceId: { videoId } },
    contentDetails: { videoId },
    status: { privacyStatus: 'public' },
  };
}

function video(id: string) {
  return {
    id,
    snippet: { channelTitle: 'Queen Official', description: '' },
    status: { privacyStatus: 'public', uploadStatus: 'processed' },
  };
}

const PLAYLIST_ROUTE = () => ({
  items: [
    {
      id: PLAYLIST_ID,
      snippet: { title: 'Rock', channelTitle: 'Yo' },
      contentDetails: { itemCount: 4 },
    },
  ],
});

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_YOUTUBE_API_KEY', 'test-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('analyzePlaylist', () => {
  it('detecta duplicados y videos no disponibles', async () => {
    const fetchMock = mockApi({
      playlists: PLAYLIST_ROUTE,
      playlistItems: () => ({
        items: [
          item('v1', 'Queen - Song A', 0),
          item('v2', 'Queen - Song A (Official Video)', 1),
          item('v3', 'Deleted video', 2),
          item('v4', 'Private video', 3),
        ],
      }),
      videos: () => ({ items: [video('v1'), video('v2')] }),
    });

    const result = await analyzePlaylist(PLAYLIST_ID);

    expect(result.info).toEqual({
      playlistId: PLAYLIST_ID,
      title: 'Rock',
      channelTitle: 'Yo',
      reportedItemCount: 4,
    });
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0]?.videos.map((v) => v.videoId)).toEqual([
      'v1',
      'v2',
    ]);
    expect(
      result.unavailable.map((v) => [v.videoId, v.availability]),
    ).toEqual([
      ['v3', 'deleted'],
      ['v4', 'private'],
    ]);
    // La clave se envía en cada llamada.
    for (const [url] of fetchMock.mock.calls) {
      expect(new URL(String(url)).searchParams.get('key')).toBe('test-key');
    }
  });

  it('recorre todas las páginas de la playlist', async () => {
    mockApi({
      playlists: PLAYLIST_ROUTE,
      playlistItems: (params) =>
        params.get('pageToken') === 'p2'
          ? { items: [item('v2', 'B', 1)] }
          : { items: [item('v1', 'A', 0)], nextPageToken: 'p2' },
      videos: () => ({ items: [video('v1'), video('v2')] }),
    });

    const result = await analyzePlaylist(PLAYLIST_ID);
    expect(result.videos.map((v) => v.videoId)).toEqual(['v1', 'v2']);
  });

  it('recupera el título previo de un video eliminado', async () => {
    mockApi({
      playlists: PLAYLIST_ROUTE,
      playlistItems: () => ({ items: [item('v3', 'Deleted video', 0)] }),
      videos: () => ({ items: [] }),
    });
    const previous = makeResult([
      makeVideo({ videoId: 'v3', title: 'Queen - Song B', artist: 'Queen' }),
    ]);

    const result = await analyzePlaylist(PLAYLIST_ID, previous);

    expect(result.videos[0]).toMatchObject({
      availability: 'deleted',
      previousTitle: 'Queen - Song B',
      artist: 'Queen',
    });
  });

  it('traduce la cuota agotada a un error tipado', async () => {
    mockApi(
      {
        playlists: () => ({
          error: { code: 403, errors: [{ reason: 'quotaExceeded' }] },
        }),
        playlistItems: () => ({
          error: { code: 403, errors: [{ reason: 'quotaExceeded' }] },
        }),
      },
      403,
    );

    await expect(analyzePlaylist(PLAYLIST_ID)).rejects.toMatchObject({
      name: 'YouTubeApiError',
      code: 'quota-exceeded',
    });
  });

  it('traduce una clave inválida a un error "forbidden"', async () => {
    const invalidKey = () => ({
      error: {
        code: 400,
        message: 'API key not valid. Please pass a valid API key.',
        errors: [{ reason: 'badRequest' }],
      },
    });
    mockApi({ playlists: invalidKey, playlistItems: invalidKey }, 400);

    await expect(analyzePlaylist(PLAYLIST_ID)).rejects.toMatchObject({
      code: 'forbidden',
    });
  });

  it('falla sin llamar a la red si falta la clave', async () => {
    vi.stubEnv('NEXT_PUBLIC_YOUTUBE_API_KEY', '');
    const fetchMock = mockApi({});

    const error = await analyzePlaylist(PLAYLIST_ID).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(YouTubeApiError);
    expect(error).toMatchObject({ code: 'missing-key' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
