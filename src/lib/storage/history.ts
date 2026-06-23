/**
 * Persistencia local (LocalStorage) para caché de análisis e historial.
 *
 * Objetivos: evitar llamadas repetidas a la API, reducir consumo de cuota y
 * mejorar los tiempos de respuesta. Todas las operaciones son tolerantes a
 * fallos (modo incógnito, cuota llena, SSR) y nunca lanzan excepciones.
 */

import type { AnalysisResult, HistoryEntry } from '@/types';
import { countDuplicateItems } from '@/lib/analysis/duplicates';

const HISTORY_KEY = 'ytpa:history:v1';
const ANALYSIS_PREFIX = 'ytpa:analysis:v1:';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function analysisKey(playlistId: string): string {
  return `${ANALYSIS_PREFIX}${playlistId}`;
}

function readJson<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Construye el registro de historial a partir de un análisis. */
export function toHistoryEntry(result: AnalysisResult): HistoryEntry {
  return {
    playlistId: result.info.playlistId,
    title: result.info.title,
    analyzedAt: result.analyzedAt,
    totalItems: result.videos.length,
    totalDuplicateItems: countDuplicateItems(result.duplicates),
    totalDuplicateGroups: result.duplicates.length,
    totalUnavailable: result.unavailable.length,
  };
}

/** Devuelve el historial ordenado del análisis más reciente al más antiguo. */
export function loadHistory(): HistoryEntry[] {
  const history = readJson<HistoryEntry[]>(HISTORY_KEY) ?? [];
  return [...history].sort(
    (a, b) => Date.parse(b.analyzedAt) - Date.parse(a.analyzedAt),
  );
}

/** Recupera un análisis cacheado por ID, o `null` si no existe. */
export function loadAnalysis(playlistId: string): AnalysisResult | null {
  return readJson<AnalysisResult>(analysisKey(playlistId));
}

/** Guarda un análisis y actualiza (upsert) su entrada de historial. */
export function saveAnalysis(result: AnalysisResult): void {
  writeJson(analysisKey(result.info.playlistId), result);

  const history = loadHistory().filter(
    (entry) => entry.playlistId !== result.info.playlistId,
  );
  history.unshift(toHistoryEntry(result));
  writeJson(HISTORY_KEY, history);
}

/** Elimina un análisis y su entrada de historial. */
export function deleteAnalysis(playlistId: string): void {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(analysisKey(playlistId));
    } catch {
      /* ignorar */
    }
  }
  const history = loadHistory().filter(
    (entry) => entry.playlistId !== playlistId,
  );
  writeJson(HISTORY_KEY, history);
}

/** Borra todo el historial y los análisis cacheados. */
export function clearHistory(): void {
  if (!isBrowser()) return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && (key === HISTORY_KEY || key.startsWith(ANALYSIS_PREFIX))) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    /* ignorar */
  }
}
