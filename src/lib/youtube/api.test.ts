import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLAYLIST_ID } from '@/lib/testing/fixtures';
import { fetchPlaylistInfo, fetchVideoStatuses } from './api';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

const RATE_LIMITED = jsonResponse(403, {
  error: { code: 403, errors: [{ reason: 'rateLimitExceeded' }] },
});

const PLAYLIST_OK = jsonResponse(200, {
  items: [{ id: PLAYLIST_ID, snippet: { title: 'Rock' } }],
});

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_YOUTUBE_API_KEY', 'test-key');
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('cliente de la API', () => {
  it('envía cada petición con un timeout', async () => {
    const fetchMock = vi.fn(async () => PLAYLIST_OK);
    vi.stubGlobal('fetch', fetchMock);

    await fetchPlaylistInfo(PLAYLIST_ID);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('traduce un timeout a un error de red', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('The operation timed out.', 'TimeoutError');
      }),
    );

    await expect(fetchPlaylistInfo(PLAYLIST_ID)).rejects.toMatchObject({
      code: 'network',
      message: expect.stringContaining('tardó demasiado'),
    });
  });

  it('reintenta una vez ante rate-limit', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(RATE_LIMITED)
      .mockResolvedValueOnce(PLAYLIST_OK);
    vi.stubGlobal('fetch', fetchMock);

    const promise = fetchPlaylistInfo(PLAYLIST_ID);
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toMatchObject({ title: 'Rock' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('no reintenta más de una vez', async () => {
    const fetchMock = vi.fn(async () => RATE_LIMITED);
    vi.stubGlobal('fetch', fetchMock);

    const promise = fetchPlaylistInfo(PLAYLIST_ID);
    const assertion = expect(promise).rejects.toMatchObject({
      code: 'rate-limit',
    });
    await vi.runAllTimersAsync();

    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('no reintenta la cuota diaria agotada', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(403, {
        error: { code: 403, errors: [{ reason: 'quotaExceeded' }] },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPlaylistInfo(PLAYLIST_ID)).rejects.toMatchObject({
      code: 'quota-exceeded',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('no llama a la API si la petición ya se canceló', async () => {
    const fetchMock = vi.fn(async () => PLAYLIST_OK);
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    controller.abort();

    await expect(
      fetchPlaylistInfo(PLAYLIST_ID, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propaga la cancelación en lugar de reportar un error de red', async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        controller.abort();
        throw new DOMException('Aborted', 'AbortError');
      }),
    );

    await expect(
      fetchPlaylistInfo(PLAYLIST_ID, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('fetchVideoStatuses', () => {
  /** IDs suficientes para `batches` lotes de 50. */
  function ids(batches: number): string[] {
    return Array.from({ length: batches * 50 }, (_, i) => `v${i}`);
  }

  function videosFor(url: string): Response {
    const batch = new URL(url).searchParams.get('id')?.split(',') ?? [];
    return jsonResponse(200, { items: batch.map((id) => ({ id })) });
  }

  it('consulta todos los lotes con concurrencia limitada', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const fetchMock = vi.fn(async (url: string) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return videosFor(url);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchVideoStatuses(ids(10));

    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(result.size).toBe(500);
    expect(maxInFlight).toBeGreaterThan(1);
    expect(maxInFlight).toBeLessThanOrEqual(4);
  });

  it('deja de pedir lotes tras el primer error', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(403, {
        error: { code: 403, errors: [{ reason: 'quotaExceeded' }] },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchVideoStatuses(ids(10))).rejects.toMatchObject({
      code: 'quota-exceeded',
    });
    // Solo los lotes que ya estaban en vuelo cuando ocurrió el error.
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(4);
  });
});
