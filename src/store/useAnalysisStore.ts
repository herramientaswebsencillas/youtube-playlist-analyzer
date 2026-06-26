/**
 * Store global (Zustand) que coordina la entrada del usuario, el análisis,
 * la caché local y el historial.
 *
 * Flujo de caché: antes de llamar a la API se busca un análisis previo del
 * mismo ID. Si existe y no se fuerza la actualización, se reutiliza.
 */

import { create } from 'zustand';
import type { AnalysisResult, ApiErrorCode, HistoryEntry } from '@/types';
import { parsePlaylistInput } from '@/lib/youtube/parseInput';
import { analyzePlaylist } from '@/lib/analysis/analyze';
import { parseImportedAnalysis } from '@/lib/export/import';
import { YouTubeApiError } from '@/lib/youtube/api';
import { CaptchaError, executeCaptcha } from '@/lib/captcha/recaptcha';
import {
  clearHistory,
  deleteAnalysis,
  loadAnalysis,
  loadHistory,
  saveAnalysis,
} from '@/lib/storage/history';

export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface AppError {
  code: ApiErrorCode;
  message: string;
}

interface AnalysisState {
  input: string;
  status: Status;
  result: AnalysisResult | null;
  fromCache: boolean;
  error: AppError | null;
  history: HistoryEntry[];

  setInput: (value: string) => void;
  hydrateHistory: () => void;
  analyze: (rawInput?: string, options?: { force?: boolean }) => Promise<void>;
  importAnalysis: (text: string) => void;
  openFromHistory: (playlistId: string) => void;
  refresh: (playlistId: string) => Promise<void>;
  removeHistory: (playlistId: string) => void;
  clearAllHistory: () => void;
  reset: () => void;
}

function runAnalysis(
  set: (partial: Partial<AnalysisState>) => void,
  playlistId: string,
  force: boolean,
): Promise<void> {
  // El análisis anterior sirve tanto de caché como de fuente para recuperar
  // los títulos de videos que ahora estén eliminados/privados.
  const previous = loadAnalysis(playlistId);

  // 1) Usar caché salvo que se fuerce la actualización.
  if (!force && previous) {
    set({ status: 'success', result: previous, fromCache: true, error: null });
    return Promise.resolve();
  }

  // 2) Consultar la API (pasando el previo para recuperar títulos).
  // Antes de tocar la API se exige superar el reto reCAPTCHA: así solo se
  // verifica a un humano cuando realmente se va a consumir cuota, no en los
  // aciertos de caché.
  set({ status: 'loading', error: null, fromCache: false });
  return executeCaptcha()
    .then(() => analyzePlaylist(playlistId, previous))
    .then((result) => {
      saveAnalysis(result);
      set({
        status: 'success',
        result,
        fromCache: false,
        error: null,
        history: loadHistory(),
      });
    })
    .catch((err: unknown) => {
      let error: AppError;
      if (err instanceof YouTubeApiError) {
        error = { code: err.code, message: err.message };
      } else if (err instanceof CaptchaError) {
        error = { code: 'captcha-failed', message: err.message };
      } else {
        error = { code: 'unknown', message: 'Ocurrió un error inesperado.' };
      }
      set({ status: 'error', error, fromCache: false });
    });
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  input: '',
  status: 'idle',
  result: null,
  fromCache: false,
  error: null,
  history: [],

  setInput: (value) => set({ input: value }),

  hydrateHistory: () => set({ history: loadHistory() }),

  analyze: async (rawInput, options) => {
    const value = rawInput ?? get().input;
    const parsed = parsePlaylistInput(value);
    if (!parsed.ok) {
      set({
        status: 'error',
        error: { code: 'invalid-input', message: parsed.message },
        result: null,
      });
      return;
    }
    await runAnalysis(set, parsed.playlistId, options?.force ?? false);
  },

  importAnalysis: (text) => {
    try {
      const result = parseImportedAnalysis(text);
      // Guardar en caché e historial para futuras recuperaciones de títulos.
      saveAnalysis(result);
      set({
        status: 'success',
        result,
        fromCache: true,
        error: null,
        history: loadHistory(),
        input: result.info.playlistId,
      });
    } catch (err) {
      set({
        status: 'error',
        error: {
          code: 'invalid-input',
          message:
            err instanceof Error
              ? err.message
              : 'No se pudo importar el archivo de análisis.',
        },
      });
    }
  },

  openFromHistory: (playlistId) => {
    const cached = loadAnalysis(playlistId);
    if (cached) {
      set({
        status: 'success',
        result: cached,
        fromCache: true,
        error: null,
        input: cached.info.playlistId,
      });
    } else {
      // El resumen existe pero el detalle se perdió: forzar re-análisis.
      set({ input: playlistId });
      void runAnalysis(set, playlistId, true);
    }
  },

  refresh: async (playlistId) => {
    set({ input: playlistId });
    await runAnalysis(set, playlistId, true);
  },

  removeHistory: (playlistId) => {
    deleteAnalysis(playlistId);
    const history = loadHistory();
    const current = get().result;
    const clearCurrent = current?.info.playlistId === playlistId;
    set({
      history,
      ...(clearCurrent
        ? { result: null, status: 'idle', fromCache: false }
        : {}),
    });
  },

  clearAllHistory: () => {
    clearHistory();
    set({ history: [], result: null, status: 'idle', fromCache: false });
  },

  reset: () =>
    set({ status: 'idle', result: null, error: null, fromCache: false }),
}));
