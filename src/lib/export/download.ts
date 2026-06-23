/**
 * Utilidad para descargar contenido generado en el navegador como archivo.
 */

/** Genera un nombre de archivo seguro a partir del título y la fecha. */
export function buildFileName(
  playlistTitle: string,
  extension: string,
): string {
  const slug = playlistTitle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60) || 'playlist';
  const date = new Date().toISOString().slice(0, 10);
  return `analisis-${slug}-${date}.${extension}`;
}

/** Dispara la descarga de una cadena de texto como archivo. */
export function downloadTextFile(
  content: string,
  fileName: string,
  mimeType: string,
): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Liberar el objeto URL en el siguiente ciclo del event loop.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
