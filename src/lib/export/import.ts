/**
 * Importación de análisis previamente exportados (JSON).
 *
 * Reconstruye un `AnalysisResult` válido a partir del archivo con la misma
 * validación que se aplica a la caché local (`toAnalysisResult`). El objetivo
 * principal es repoblar la caché para recuperar títulos de videos eliminados
 * aunque se hayan borrado los datos del navegador.
 */

import type { AnalysisResult } from '@/types';
import { toAnalysisResult } from '@/lib/analysis/validate';

/**
 * Tamaño máximo aceptado para un archivo importado. Una exportación de una
 * playlist de 5 000 elementos ronda los 5 MB; el margen evita congelar la
 * pestaña al leer archivos arbitrariamente grandes.
 */
export const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

/**
 * Convierte el texto de un archivo exportado en un `AnalysisResult`.
 * Lanza `Error` con un mensaje legible si el contenido no es válido.
 */
export function parseImportedAnalysis(text: string): AnalysisResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }

  const result = toAnalysisResult(parsed);
  if (result.videos.length === 0) {
    throw new Error('El archivo no contiene elementos de la playlist.');
  }
  return result;
}
