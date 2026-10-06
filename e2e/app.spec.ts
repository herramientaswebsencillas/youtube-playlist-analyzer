import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const PLAYLIST_ID = 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf';

/** Exportación mínima con un grupo de duplicados y un video eliminado. */
const EXPORT = {
  generatedBy: 'YouTube Playlist Analyzer',
  schemaVersion: 1,
  playlist: {
    playlistId: PLAYLIST_ID,
    title: 'Rock clásico',
    channelTitle: 'Mi canal',
    reportedItemCount: 3,
  },
  analyzedAt: '2026-01-01T00:00:00.000Z',
  // Sin miniaturas para no depender de la red.
  videos: [
    { videoId: 'v1', title: 'Queen - Bohemian Rhapsody', artist: 'Queen', position: 0 },
    {
      videoId: 'v2',
      title: 'Queen - Bohemian Rhapsody (Official Video)',
      artist: 'Queen',
      position: 1,
    },
    {
      videoId: 'v3',
      title: 'Deleted video',
      previousTitle: 'Queen - Under Pressure',
      availability: 'deleted',
      reason: 'Video eliminado',
      position: 2,
    },
  ],
};

/** Registra las violaciones de CSP y los errores de la página. */
function collectProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && /Content Security Policy/i.test(message.text())) {
      problems.push(`csp: ${message.text()}`);
    }
  });
  return problems;
}

async function importExport(page: Page) {
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: 'analisis.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(EXPORT)),
    });
}

test('carga con la CSP de producción y sin errores', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('./');

  await expect(
    page.getByRole('heading', { name: 'Analizador de playlists' }),
  ).toBeVisible();
  await expect(
    page.locator('meta[http-equiv="Content-Security-Policy"]'),
  ).toHaveCount(1);
  expect(problems).toEqual([]);
});

test('importar, ver resultados, exportar y reabrir desde el historial', async ({
  page,
}) => {
  const problems = collectProblems(page);
  await page.goto('./');
  await importExport(page);

  await expect(page.getByRole('heading', { name: 'Rock clásico' })).toBeVisible();
  // Duplicados: el primer grupo se muestra abierto con sus dos elementos.
  await expect(page.getByText('2 elementos repetidos')).toBeVisible();
  // El video eliminado conserva el título recuperado.
  await expect(page.getByRole('heading', { name: 'Videos no disponibles' })).toBeVisible();
  await expect(page.getByText('Queen - Under Pressure').first()).toBeVisible();

  // Exportar devuelve un JSON reimportable con los mismos datos.
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar análisis (JSON)' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^analisis-rock-clasico-.*\.json$/);
  const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(exported).toMatchObject({
    schemaVersion: 1,
    playlist: { playlistId: PLAYLIST_ID, title: 'Rock clásico' },
    totals: { items: 3, duplicateGroups: 1, duplicateItems: 2, unavailable: 1 },
  });

  // El historial sobrevive a la recarga y permite reabrir sin la API.
  await page.reload();
  const history = page.locator('li', { hasText: PLAYLIST_ID });
  await expect(history).toBeVisible();
  await history.getByRole('button', { name: 'Abrir' }).click();
  await expect(page.getByRole('heading', { name: 'Rock clásico' })).toBeVisible();

  // Eliminar la entrada la quita del historial y de la pantalla.
  await history.getByRole('button', { name: 'Eliminar' }).click();
  await expect(history).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Rock clásico' })).toHaveCount(0);

  expect(problems).toEqual([]);
});

test('rechaza un archivo que no es JSON', async ({ page }) => {
  await page.goto('./');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'malo.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{no es json'),
  });
  await expect(
    page.getByRole('alert').filter({ hasText: 'El archivo no es un JSON válido.' }),
  ).toBeVisible();
});

test('sobrevive a datos locales con formato inesperado', async ({ page }) => {
  const problems = collectProblems(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('ytpa:history:v1', '{}');
  });
  await page.goto('./');

  await expect(
    page.getByRole('heading', { name: 'Analizador de playlists' }),
  ).toBeVisible();
  await expect(page.getByText('Aún no hay análisis guardados.')).toBeVisible();
  expect(problems).toEqual([]);
});

test('las páginas de privacidad y «Acerca de» cargan', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Acerca de' }).first().click();
  await expect(page).toHaveURL(/\/acerca-de\/$/);
  await page.goto('./privacidad/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
