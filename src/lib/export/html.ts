/**
 * Exportación a HTML: documento autónomo con estilos en línea, abrible en
 * cualquier navegador y fácil de copiar. Todo el contenido dinámico se escapa
 * para prevenir XSS.
 */

import type { AnalysisResult, PlaylistVideo } from '@/types';
import { escapeHtml, safeYouTubeUrl } from '@/lib/utils/sanitize';

const AVAILABILITY_LABEL: Record<PlaylistVideo['availability'], string> = {
  available: 'Disponible',
  deleted: 'Eliminado',
  private: 'Privado',
  unavailable: 'No disponible',
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('es');
}

function videoRow(video: PlaylistVideo): string {
  const url = safeYouTubeUrl(video.url);
  const titleCell = url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(video.title)}</a>`
    : escapeHtml(video.title);
  return `<tr>
      <td>${titleCell}</td>
      <td><code>${escapeHtml(video.videoId)}</code></td>
      <td>${escapeHtml(video.channelTitle ?? '—')}</td>
      <td>${escapeHtml(AVAILABILITY_LABEL[video.availability])}</td>
      <td>${escapeHtml(video.reason || '—')}</td>
    </tr>`;
}

export function toHtml(result: AnalysisResult): string {
  const { info } = result;
  const generatedAt = formatDate(result.analyzedAt);

  const duplicatesHtml = result.duplicates.length
    ? result.duplicates
        .map(
          (group) => `<section class="group">
        <h3>${escapeHtml(group.label)} <span class="count">${group.videos.length} elementos</span></h3>
        <table>
          <thead><tr><th>Título</th><th>ID</th><th>Canal</th><th>Estado</th><th>Motivo</th></tr></thead>
          <tbody>${group.videos.map(videoRow).join('')}</tbody>
        </table>
      </section>`,
        )
        .join('')
    : '<p class="empty">No se detectaron canciones repetidas.</p>';

  const unavailableHtml = result.unavailable.length
    ? `<table>
        <thead><tr><th>Título</th><th>ID</th><th>Canal</th><th>Estado</th><th>Motivo</th></tr></thead>
        <tbody>${result.unavailable.map(videoRow).join('')}</tbody>
      </table>`
    : '<p class="empty">No se encontraron videos no disponibles.</p>';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Análisis de playlist — ${escapeHtml(info.title)}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #13151a; background: #f6f7f9; margin: 0; padding: 2rem 1rem; }
  main { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin: 0 0 .25rem; }
  h2 { font-size: 1.15rem; margin: 2rem 0 .75rem; border-bottom: 2px solid #e4e7ec; padding-bottom: .35rem; }
  h3 { font-size: 1rem; margin: 1.25rem 0 .5rem; }
  .meta { color: #5b6270; font-size: .9rem; }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: .75rem; margin: 1.25rem 0; }
  .stat { background: #fff; border: 1px solid #e4e7ec; border-radius: 12px; padding: .75rem 1rem; }
  .stat b { display: block; font-size: 1.4rem; }
  .stat span { color: #5b6270; font-size: .8rem; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e4e7ec; border-radius: 8px; overflow: hidden; font-size: .9rem; }
  th, td { text-align: left; padding: .5rem .65rem; border-bottom: 1px solid #eef0f3; vertical-align: top; }
  th { background: #f0f1f4; font-weight: 600; }
  tr:last-child td { border-bottom: none; }
  code { font-family: ui-monospace, monospace; font-size: .82em; background: #f0f1f4; padding: .1rem .3rem; border-radius: 4px; }
  .count { color: #5b6270; font-weight: 400; font-size: .82rem; }
  .empty { color: #5b6270; font-style: italic; }
  a { color: #3a2fb8; }
  footer { margin-top: 2.5rem; color: #5b6270; font-size: .8rem; }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(info.title)}</h1>
  <p class="meta">ID: <code>${escapeHtml(info.playlistId)}</code>${
    info.channelTitle ? ` · Canal: ${escapeHtml(info.channelTitle)}` : ''
  } · Analizado: ${escapeHtml(generatedAt)}</p>

  <div class="summary">
    <div class="stat"><b>${result.videos.length}</b><span>Elementos</span></div>
    <div class="stat"><b>${result.duplicates.reduce((s, g) => s + g.videos.length, 0)}</b><span>Repetidos</span></div>
    <div class="stat"><b>${result.duplicates.length}</b><span>Grupos de duplicados</span></div>
    <div class="stat"><b>${result.unavailable.length}</b><span>No disponibles</span></div>
  </div>

  <h2>Canciones repetidas</h2>
  ${duplicatesHtml}

  <h2>Videos no disponibles</h2>
  ${unavailableHtml}

  <footer>Generado con YouTube Playlist Analyzer.</footer>
</main>
</body>
</html>`;
}
