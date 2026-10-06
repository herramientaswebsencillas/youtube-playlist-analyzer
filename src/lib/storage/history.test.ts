import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeResult, makeVideo, PLAYLIST_ID } from '@/lib/testing/fixtures';
import { MemoryStorage } from '@/lib/testing/memoryStorage';
import {
  clearHistory,
  deleteAnalysis,
  loadAnalysis,
  loadHistory,
  saveAnalysis,
} from './history';

const OTHER_ID = 'PLotherPlaylistId12345';

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal('window', { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('historial en LocalStorage', () => {
  it('guarda y recupera un análisis', () => {
    const result = makeResult([makeVideo({ videoId: 'a', title: 'Song' })]);
    expect(saveAnalysis(result)).toBe(true);
    expect(loadAnalysis(result.info.playlistId)).toEqual(result);
    expect(loadHistory()).toEqual([
      expect.objectContaining({
        playlistId: result.info.playlistId,
        totalItems: 1,
      }),
    ]);
  });

  it('actualiza la entrada existente en lugar de duplicarla', () => {
    const result = makeResult([makeVideo({ videoId: 'a', title: 'Song' })]);
    saveAnalysis(result);
    saveAnalysis({ ...result, analyzedAt: '2026-02-01T00:00:00.000Z' });
    expect(loadHistory()).toHaveLength(1);
  });

  it('ordena del más reciente al más antiguo', () => {
    const older = makeResult([makeVideo({ videoId: 'a', title: 'A' })]);
    const newer = {
      ...makeResult([makeVideo({ videoId: 'b', title: 'B' })], OTHER_ID),
      analyzedAt: '2026-06-01T00:00:00.000Z',
    };
    saveAnalysis(newer);
    saveAnalysis(older);
    expect(loadHistory().map((e) => e.playlistId)).toEqual([
      OTHER_ID,
      older.info.playlistId,
    ]);
  });

  it('informa cuando el navegador no puede guardar', () => {
    storage.full = true;
    const result = makeResult([makeVideo({ videoId: 'a', title: 'Song' })]);
    expect(saveAnalysis(result)).toBe(false);
    expect(loadHistory()).toEqual([]);
  });

  it('elimina un análisis y su entrada', () => {
    const result = makeResult([makeVideo({ videoId: 'a', title: 'Song' })]);
    saveAnalysis(result);
    deleteAnalysis(result.info.playlistId);
    expect(loadAnalysis(result.info.playlistId)).toBeNull();
    expect(loadHistory()).toEqual([]);
  });

  it('limpia solo las claves propias de la aplicación', () => {
    storage.setItem('otra-app', 'x');
    saveAnalysis(makeResult([makeVideo({ videoId: 'a', title: 'A' })]));
    saveAnalysis(
      makeResult([makeVideo({ videoId: 'b', title: 'B' })], OTHER_ID),
    );
    clearHistory();
    expect(storage.length).toBe(1);
    expect(storage.getItem('otra-app')).toBe('x');
  });

  it('tolera datos corruptos', () => {
    storage.setItem('ytpa:history:v1', '{no es json');
    expect(loadHistory()).toEqual([]);
  });

  it('tolera un historial que no es un arreglo', () => {
    storage.setItem('ytpa:history:v1', '{}');
    expect(loadHistory()).toEqual([]);
  });

  it('descarta entradas de historial con forma inválida', () => {
    const result = makeResult([makeVideo({ videoId: 'a', title: 'Song' })]);
    saveAnalysis(result);
    const valid = JSON.parse(storage.getItem('ytpa:history:v1') ?? '[]');
    storage.setItem(
      'ytpa:history:v1',
      JSON.stringify([
        null,
        'x',
        { playlistId: '../../x', title: 'Mala' },
        ...valid,
      ]),
    );
    expect(loadHistory().map((e) => e.playlistId)).toEqual([
      result.info.playlistId,
    ]);
  });

  it('descarta y borra un análisis guardado con forma inválida', () => {
    const key = `ytpa:analysis:v1:${PLAYLIST_ID}`;
    storage.setItem(key, JSON.stringify({ info: null, videos: 5 }));
    expect(loadAnalysis(PLAYLIST_ID)).toBeNull();
    expect(storage.getItem(key)).toBeNull();
  });

  it('descarta un análisis guardado bajo otro ID', () => {
    const other = makeResult(
      [makeVideo({ videoId: 'a', title: 'A' })],
      OTHER_ID,
    );
    storage.setItem(`ytpa:analysis:v1:${PLAYLIST_ID}`, JSON.stringify(other));
    expect(loadAnalysis(PLAYLIST_ID)).toBeNull();
  });

  it('completa campos faltantes de un análisis guardado', () => {
    const result = makeResult([makeVideo({ videoId: 'a', title: 'Song' })]);
    storage.setItem(
      `ytpa:analysis:v1:${PLAYLIST_ID}`,
      JSON.stringify({
        info: result.info,
        videos: result.videos,
        analyzedAt: result.analyzedAt,
      }),
    );
    expect(loadAnalysis(PLAYLIST_ID)).toEqual(result);
  });
});
