/**
 * Fachada de exportación: conecta cada formato con la descarga del archivo.
 */

import type { AnalysisResult } from '@/types';
import { buildFileName, downloadTextFile } from './download';
import { toCsv } from './csv';
import { toJson } from './json';
import { toHtml } from './html';

export type ExportFormat = 'csv' | 'json' | 'html';

export function exportAnalysis(
  result: AnalysisResult,
  format: ExportFormat,
): void {
  switch (format) {
    case 'csv':
      downloadTextFile(
        toCsv(result),
        buildFileName(result.info.title, 'csv'),
        'text/csv',
      );
      break;
    case 'json':
      downloadTextFile(
        toJson(result),
        buildFileName(result.info.title, 'json'),
        'application/json',
      );
      break;
    case 'html':
      downloadTextFile(
        toHtml(result),
        buildFileName(result.info.title, 'html'),
        'text/html',
      );
      break;
  }
}
