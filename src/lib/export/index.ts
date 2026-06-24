/**
 * Fachada de exportación.
 *
 * Se exporta únicamente en JSON, que es el formato completo y sin pérdida:
 * incluye todos los videos con sus campos, por lo que puede reimportarse para
 * restaurar la caché y recuperar títulos de videos eliminados. (CSV y HTML
 * eran formatos de lectura parciales y no reimportables, por lo que se
 * retiraron para homologar exportación e importación.)
 */

import type { AnalysisResult } from '@/types';
import { buildFileName, downloadTextFile } from './download';
import { toJson } from './json';

export function exportAnalysis(result: AnalysisResult): void {
  downloadTextFile(
    toJson(result),
    buildFileName(result.info.title, 'json'),
    'application/json',
  );
}
