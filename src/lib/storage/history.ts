/**
 * Persistencia local (LocalStorage) para caché de análisis e historial.
 *
 * Objetivos: evitar llamadas repetidas a la API, reducir consumo de cuota y
 * mejorar los tiempos de respuesta. Todas las operaciones son tolerantes a
 * fallos (modo incógnito, cuota llena, SSR) y nunca lanzan excepciones.
 */

import type { AnalysisResult, HistoryEntry } from '@/types';
import { countDuplicateItems } from '@/lib/analysis/duplicates';
import { asRecord, toAnalysisResult } from '@/lib/analysis/validate';
import { isPlaylistId } from '@/lib/youtube/parseInput';

const HISTORY_KEY = 'ytpa:history:v1';
const ANALYSIS_PREFIX = 'ytpa:analysis:v1:';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function analysisKey(playlistId: string): string {
  return `${ANALYSIS_PREFIX}${playlistId}`;
}

/**
 * Lee y parsea una clave. El resultado no está tipado: LocalStorage es
 * compartido por todo el origen (en github.io, con los demás sitios de la
 * organización) y puede contener datos de otra versión o de otro sitio.
 */
function readJson(key: string): unknown {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function removeKey(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignorar */
  }
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  const e = asRecord(value);
  return (
    !!e &&
    typeof e.playlistId === 'string' &&
    isPlaylistId(e.playlistId) &&
    typeof e.title === 'string' &&
    typeof e.analyzedAt === 'string' &&
    typeof e.totalItems === 'number' &&
    typeof e.totalDuplicateItems === 'number' &&
    typeof e.totalDuplicateGroups === 'number' &&
    typeof e.totalUnavailable === 'number'
  );
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

/**
 * Devuelve el historial ordenado del análisis más reciente al más antiguo.
 * Descarta en silencio las entradas que no tengan la forma esperada.
 */
export function loadHistory(): HistoryEntry[] {
  const raw = readJson(HISTORY_KEY);
  const history = Array.isArray(raw) ? raw.filter(isHistoryEntry) : [];
  return history.sort(
    (a, b) => Date.parse(b.analyzedAt) - Date.parse(a.analyzedAt),
  );
}

/**
 * Recupera un análisis cacheado por ID, o `null` si no existe. Un valor
 * inválido se borra para que el siguiente análisis lo reemplace.
 */
export function loadAnalysis(playlistId: string): AnalysisResult | null {
  const key = analysisKey(playlistId);
  const raw = readJson(key);
  if (raw === null) return null;
  try {
    const result = toAnalysisResult(raw);
    if (result.info.playlistId !== playlistId) {
      throw new Error('El análisis guardado no corresponde a la playlist.');
    }
    return result;
  } catch {
    removeKey(key);
    return null;
  }
}

/**
 * Guarda un análisis y actualiza (upsert) su entrada de historial.
 * Devuelve `false` si el navegador no pudo guardar el detalle (p. ej. cuota
 * de LocalStorage llena), para que la UI pueda avisar al usuario.
 */
export function saveAnalysis(result: AnalysisResult): boolean {
  const saved = writeJson(analysisKey(result.info.playlistId), result);
  // Sin detalle guardado, una entrada de historial solo forzaría un re-análisis.
  if (!saved) return false;

  const history = loadHistory().filter(
    (entry) => entry.playlistId !== result.info.playlistId,
  );
  history.unshift(toHistoryEntry(result));
  return writeJson(HISTORY_KEY, history);
}

/** Elimina un análisis y su entrada de historial. */
export function deleteAnalysis(playlistId: string): void {
  removeKey(analysisKey(playlistId));
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
