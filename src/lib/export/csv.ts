/**
 * Exportación a CSV compatible con Excel, LibreOffice Calc y Google Sheets.
 * Incluye un BOM UTF-8 para que Excel respete los acentos.
 */

import type { AnalysisResult, PlaylistVideo } from '@/types';

const BOM = '\uFEFF';

/** Escapa un valor para CSV (comillas, comas y saltos de línea). */
function csvCell(value: string | number | null): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function row(cells: Array<string | number | null>): string {
  return cells.map(csvCell).join(',');
}

const COLUMNS = [
  'Sección',
  'Grupo',
  'Título',
  'ID Video',
  'URL',
  'Canal',
  'Estado',
  'Motivo',
  'Posición',
];

const AVAILABILITY_LABEL: Record<PlaylistVideo['availability'], string> = {
  available: 'Disponible',
  deleted: 'Eliminado',
  private: 'Privado',
  unavailable: 'No disponible',
};

export function toCsv(result: AnalysisResult): string {
  const lines: string[] = [];

  // Metadatos generales.
  lines.push(row(['Playlist', result.info.title]));
  lines.push(row(['ID', result.info.playlistId]));
  lines.push(row(['Canal', result.info.channelTitle]));
  lines.push(row(['Analizado', result.analyzedAt]));
  lines.push(row(['Total elementos', result.videos.length]));
  lines.push(row(['Grupos de duplicados', result.duplicates.length]));
  lines.push(row(['Videos no disponibles', result.unavailable.length]));
  lines.push('');

  // Tabla de datos.
  lines.push(row(COLUMNS));

  for (const group of result.duplicates) {
    for (const video of group.videos) {
      lines.push(
        row([
          'Canción repetida',
          group.label,
          video.title,
          video.videoId,
          video.url,
          video.channelTitle,
          AVAILABILITY_LABEL[video.availability],
          video.reason,
          video.position,
        ]),
      );
    }
  }

  for (const video of result.unavailable) {
    lines.push(
      row([
        'No disponible',
        '',
        video.title,
        video.videoId,
        video.url,
        video.channelTitle,
        AVAILABILITY_LABEL[video.availability],
        video.reason,
        video.position,
      ]),
    );
  }

  return BOM + lines.join('\r\n');
}
