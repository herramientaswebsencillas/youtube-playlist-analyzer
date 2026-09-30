import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeResult, makeVideo } from '@/lib/testing/fixtures';
import {
  clearHistory,
  deleteAnalysis,
  loadAnalysis,
  loadHistory,
  saveAnalysis,
} from './history';

/** LocalStorage mínimo en memoria, con opción de simular cuota llena. */
class MemoryStorage {
  private data = new Map<string, string>();
  full = false;

  get length() {
    return this.data.size;
  }
  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null;
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.full) throw new Error('QuotaExceededError');
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

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
    saveAnalysis(makeResult([makeVideo({ videoId: 'b', title: 'B' })], OTHER_ID));
    clearHistory();
    expect(storage.length).toBe(1);
    expect(storage.getItem('otra-app')).toBe('x');
  });

  it('tolera datos corruptos', () => {
    storage.setItem('ytpa:history:v1', '{no es json');
    expect(loadHistory()).toEqual([]);
  });
});
