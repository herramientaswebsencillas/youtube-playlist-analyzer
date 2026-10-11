import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * Flujo principal: analizar una playlist contra la YouTube Data API.
 *
 * Las respuestas de la API y el script de reCAPTCHA se simulan con
 * `page.route`, así que no se gasta cuota ni se depende de la red. El build
 * debe tener alguna `NEXT_PUBLIC_YOUTUBE_API_KEY` (en CI es ficticia); el
 * valor da igual porque ninguna petición llega a Google.
 */

const PLAYLIST_ID = 'PLsimulada0123456789abcdef';
const API = 'https://www.googleapis.com/youtube/v3';

function item(
  position: number,
  videoId: string,
  title: string,
  owner?: string,
) {
  return {
    id: `item-${position}`,
    snippet: {
      title,
      position,
      videoOwnerChannelTitle: owner,
      resourceId: { kind: 'youtube#video', videoId },
    },
    contentDetails: { videoId },
    status: { privacyStatus: 'public' },
  };
}

/** Dos páginas: un par de duplicados y un video eliminado. */
const ITEM_PAGES: Record<string, unknown> = {
  first: {
    items: [
      item(0, 'vidA', 'Queen - Bohemian Rhapsody', 'Queen Official'),
      item(1, 'vidB', 'Queen - Bohemian Rhapsody (Official Video)', 'Queen'),
    ],
    nextPageToken: 'page2',
  },
  page2: { items: [item(2, 'vidC', 'Deleted video')] },
};

/** `videos.list` solo devuelve los videos que siguen existiendo. */
const EXISTING_VIDEOS = new Set(['vidA', 'vidB']);

/** Sustituto mínimo de grecaptcha que resuelve el reto al instante. */
const RECAPTCHA_STUB = `
  window.grecaptcha = {
    ready: (cb) => cb(),
    render: (_el, params) => { window.__recaptchaCallback = params.callback; return 0; },
    reset: () => {},
    execute: () => setTimeout(() => window.__recaptchaCallback('token'), 0),
  };
`;

/** Peticiones a la API recibidas, por endpoint. */
type Calls = Record<'playlists' | 'playlistItems' | 'videos', number>;

async function mockApi(page: Page, override?: (route: Route) => boolean) {
  const calls: Calls = { playlists: 0, playlistItems: 0, videos: 0 };

  await page.route('https://www.google.com/recaptcha/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: RECAPTCHA_STUB }),
  );

  await page.route(`${API}/**`, (route) => {
    if (override?.(route)) return;
    const url = new URL(route.request().url());
    const endpoint = url.pathname.split('/').pop() as keyof Calls;
    calls[endpoint] += 1;

    let body: unknown;
    if (endpoint === 'playlists') {
      body = {
        items: [
          {
            id: PLAYLIST_ID,
            snippet: { title: 'Mix simulado', channelTitle: 'Canal simulado' },
            contentDetails: { itemCount: 3 },
          },
        ],
      };
    } else if (endpoint === 'playlistItems') {
      body = ITEM_PAGES[url.searchParams.get('pageToken') ?? 'first'];
    } else {
      const ids = url.searchParams.get('id')?.split(',') ?? [];
      body = {
        items: ids
          .filter((id) => EXISTING_VIDEOS.has(id))
          .map((id) => ({
            id,
            snippet: { title: id, channelTitle: 'Queen' },
            status: { uploadStatus: 'processed', privacyStatus: 'public' },
          })),
      };
    }
    return route.fulfill({ json: body });
  });

  return calls;
}

/** Registra las violaciones de CSP y los errores de la página. */
function collectProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      /Content Security Policy/i.test(message.text())
    ) {
      problems.push(`csp: ${message.text()}`);
    }
  });
  return problems;
}

async function openApp(page: Page) {
  await page.goto('./');
  const missingKey = await page
    .getByText('No se detectó una clave de API')
    .isVisible();
  // En CI el build siempre lleva clave: si falta, es un error del workflow.
  test.skip(
    missingKey && !process.env.CI,
    'Build sin NEXT_PUBLIC_YOUTUBE_API_KEY: define cualquier valor y recompila.',
  );
  expect(missingKey, 'el build de CI debe incluir una clave').toBe(false);
}

async function analyze(page: Page) {
  await page
    .getByLabel('URL o ID de la playlist')
    .fill(`https://music.youtube.com/playlist?list=${PLAYLIST_ID}`);
  await page.getByRole('button', { name: 'Analizar' }).click();
}

test('analiza una playlist paginada y muestra duplicados y eliminados', async ({
  page,
}) => {
  const problems = collectProblems(page);
  const calls = await mockApi(page);
  await openApp(page);

  await analyze(page);

  await expect(
    page.getByRole('heading', { name: 'Mix simulado' }),
  ).toBeVisible();
  await expect(page.getByText('2 elementos repetidos')).toBeVisible();
  const unavailable = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Videos no disponibles' }),
  });
  await expect(
    unavailable.getByText('Eliminado', { exact: true }),
  ).toBeVisible();
  expect(calls).toEqual({ playlists: 1, playlistItems: 2, videos: 1 });

  // Queda en el historial y reabrirlo no vuelve a llamar a la API.
  await page.reload();
  await page
    .locator('li', { hasText: PLAYLIST_ID })
    .getByRole('button', { name: 'Abrir' })
    .click();
  await expect(page.getByText('Desde caché local')).toBeVisible();
  expect(calls).toEqual({ playlists: 1, playlistItems: 2, videos: 1 });

  expect(problems).toEqual([]);
});

test('muestra un mensaje claro cuando se agota la cuota', async ({ page }) => {
  await mockApi(page, (route) => {
    void route.fulfill({
      status: 403,
      json: { error: { code: 403, errors: [{ reason: 'quotaExceeded' }] } },
    });
    return true;
  });
  await openApp(page);

  await analyze(page);

  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'Se agotó la cuota diaria de la YouTube Data API.' }),
  ).toBeVisible();
});
