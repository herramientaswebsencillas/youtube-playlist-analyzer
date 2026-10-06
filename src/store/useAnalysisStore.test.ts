import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnalysisResult } from '@/types';
import { makeResult, makeVideo, PLAYLIST_ID } from '@/lib/testing/fixtures';
import { MemoryStorage } from '@/lib/testing/memoryStorage';
import { analyzePlaylist } from '@/lib/analysis/analyze';
import { executeCaptcha } from '@/lib/captcha/recaptcha';
import { loadAnalysis, loadHistory, saveAnalysis } from '@/lib/storage/history';
import { toJson } from '@/lib/export/json';
import { YouTubeApiError } from '@/lib/youtube/api';
import { useAnalysisStore } from './useAnalysisStore';

vi.mock('@/lib/analysis/analyze', () => ({ analyzePlaylist: vi.fn() }));
vi.mock('@/lib/captcha/recaptcha', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/captcha/recaptcha')>()),
  executeCaptcha: vi.fn(),
}));

const analyzeMock = vi.mocked(analyzePlaylist);
const captchaMock = vi.mocked(executeCaptcha);

const OTHER_ID = 'PLotherPlaylistId12345';

/** Promesa que la prueba resuelve o rechaza cuando quiere. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function resultFor(playlistId: string, title = 'Song'): AnalysisResult {
  return makeResult([makeVideo({ videoId: 'a', title })], playlistId);
}

const store = () => useAnalysisStore.getState();

beforeEach(() => {
  vi.stubGlobal('window', { localStorage: new MemoryStorage() });
  useAnalysisStore.setState(useAnalysisStore.getInitialState(), true);
  captchaMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe('useAnalysisStore', () => {
  it('rechaza una entrada inválida sin llamar a la API', async () => {
    await store().analyze('https://example.com/?list=abc');

    expect(store().status).toBe('error');
    expect(store().error?.code).toBe('invalid-input');
    expect(captchaMock).not.toHaveBeenCalled();
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it('usa la caché sin pasar por reCAPTCHA ni la API', async () => {
    saveAnalysis(resultFor(PLAYLIST_ID));

    await store().analyze(PLAYLIST_ID);

    expect(store()).toMatchObject({ status: 'success', fromCache: true });
    expect(captchaMock).not.toHaveBeenCalled();
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it('analiza, guarda y actualiza el historial', async () => {
    analyzeMock.mockResolvedValue(resultFor(PLAYLIST_ID));

    await store().analyze(PLAYLIST_ID);

    expect(store()).toMatchObject({
      status: 'success',
      fromCache: false,
      storageFailed: false,
    });
    expect(store().history.map((e) => e.playlistId)).toEqual([PLAYLIST_ID]);
    expect(loadAnalysis(PLAYLIST_ID)).not.toBeNull();
  });

  it('pasa el análisis previo para recuperar títulos al forzar', async () => {
    const previous = resultFor(PLAYLIST_ID, 'Anterior');
    saveAnalysis(previous);
    analyzeMock.mockResolvedValue(resultFor(PLAYLIST_ID));

    await store().refresh(PLAYLIST_ID);

    expect(analyzeMock).toHaveBeenCalledWith(PLAYLIST_ID, previous);
  });

  it('muestra los errores de la API', async () => {
    analyzeMock.mockRejectedValue(
      new YouTubeApiError('quota-exceeded', 'Se agotó la cuota.'),
    );

    await store().analyze(PLAYLIST_ID);

    expect(store()).toMatchObject({
      status: 'error',
      error: { code: 'quota-exceeded', message: 'Se agotó la cuota.' },
    });
  });

  it('ignora la respuesta de un análisis que ya no es el último', async () => {
    const first = deferred<AnalysisResult>();
    const second = deferred<AnalysisResult>();
    analyzeMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const a = store().analyze(PLAYLIST_ID);
    const b = store().analyze(OTHER_ID);
    second.resolve(resultFor(OTHER_ID));
    await b;
    first.resolve(resultFor(PLAYLIST_ID));
    await a;

    expect(store().result?.info.playlistId).toBe(OTHER_ID);
    // El resultado obsoleto sí se guarda en la caché.
    expect(
      store()
        .history.map((e) => e.playlistId)
        .sort(),
    ).toEqual([OTHER_ID, PLAYLIST_ID].sort());
  });

  describe('borrar durante un análisis (gana el borrado)', () => {
    it('descarta el resultado y no lo vuelve a guardar', async () => {
      saveAnalysis(resultFor(PLAYLIST_ID, 'Anterior'));
      const pending = deferred<AnalysisResult>();
      analyzeMock.mockReturnValueOnce(pending.promise);

      const run = store().refresh(PLAYLIST_ID);
      await vi.waitFor(() => expect(analyzeMock).toHaveBeenCalled());
      store().removeHistory(PLAYLIST_ID);
      expect(store()).toMatchObject({ status: 'idle', result: null });

      pending.resolve(resultFor(PLAYLIST_ID));
      await run;

      expect(store()).toMatchObject({ status: 'idle', result: null });
      expect(store().history).toEqual([]);
      expect(loadHistory()).toEqual([]);
      expect(loadAnalysis(PLAYLIST_ID)).toBeNull();
    });

    it('no consume cuota si se borra mientras se resuelve el reCAPTCHA', async () => {
      const captcha = deferred<void>();
      captchaMock.mockReturnValueOnce(captcha.promise);

      const run = store().analyze(PLAYLIST_ID);
      store().removeHistory(PLAYLIST_ID);
      captcha.resolve();
      await run;

      expect(analyzeMock).not.toHaveBeenCalled();
      expect(store().status).toBe('idle');
    });

    it('no muestra el error de un análisis descartado', async () => {
      const pending = deferred<AnalysisResult>();
      analyzeMock.mockReturnValueOnce(pending.promise);

      const run = store().analyze(PLAYLIST_ID);
      await vi.waitFor(() => expect(analyzeMock).toHaveBeenCalled());
      store().removeHistory(PLAYLIST_ID);
      pending.reject(new YouTubeApiError('network', 'Sin conexión.'));
      await run;

      expect(store()).toMatchObject({ status: 'idle', error: null });
    });

    it('vuelve al resultado que se mostraba antes', async () => {
      analyzeMock.mockResolvedValueOnce(resultFor(OTHER_ID));
      await store().analyze(OTHER_ID);
      const pending = deferred<AnalysisResult>();
      analyzeMock.mockReturnValueOnce(pending.promise);

      const run = store().analyze(PLAYLIST_ID);
      await vi.waitFor(() => expect(analyzeMock).toHaveBeenCalledTimes(2));
      store().removeHistory(PLAYLIST_ID);
      pending.resolve(resultFor(PLAYLIST_ID));
      await run;

      expect(store().status).toBe('success');
      expect(store().result?.info.playlistId).toBe(OTHER_ID);
    });

    it('borrar otra playlist no interrumpe el análisis en curso', async () => {
      saveAnalysis(resultFor(OTHER_ID));
      const pending = deferred<AnalysisResult>();
      analyzeMock.mockReturnValueOnce(pending.promise);

      const run = store().analyze(PLAYLIST_ID);
      await vi.waitFor(() => expect(analyzeMock).toHaveBeenCalled());
      store().removeHistory(OTHER_ID);
      expect(store().status).toBe('loading');
      pending.resolve(resultFor(PLAYLIST_ID));
      await run;

      expect(store().result?.info.playlistId).toBe(PLAYLIST_ID);
      expect(store().history.map((e) => e.playlistId)).toEqual([PLAYLIST_ID]);
    });

    it('borrar todo el historial descarta el análisis en curso', async () => {
      const pending = deferred<AnalysisResult>();
      analyzeMock.mockReturnValueOnce(pending.promise);

      const run = store().analyze(PLAYLIST_ID);
      await vi.waitFor(() => expect(analyzeMock).toHaveBeenCalled());
      store().clearAllHistory();
      pending.resolve(resultFor(PLAYLIST_ID));
      await run;

      expect(store()).toMatchObject({ status: 'idle', result: null });
      expect(loadHistory()).toEqual([]);
    });
  });

  it('borrar una entrada ajena no oculta un error visible', async () => {
    saveAnalysis(resultFor(OTHER_ID));
    await store().analyze('no es una playlist');

    store().removeHistory(OTHER_ID);

    expect(store().status).toBe('error');
  });

  it('importa un análisis y lo guarda en el historial', () => {
    store().importAnalysis(toJson(resultFor(PLAYLIST_ID)));

    expect(store()).toMatchObject({
      status: 'success',
      fromCache: true,
      input: PLAYLIST_ID,
    });
    expect(loadAnalysis(PLAYLIST_ID)).not.toBeNull();
  });

  it('informa un archivo de importación inválido', () => {
    store().importAnalysis('{no es json');

    expect(store()).toMatchObject({
      status: 'error',
      error: {
        code: 'invalid-input',
        message: 'El archivo no es un JSON válido.',
      },
    });
  });
});
