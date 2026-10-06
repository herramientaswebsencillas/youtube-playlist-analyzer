/**
 * Servidor estático mínimo para las pruebas E2E: sirve la exportación de
 * `./out` bajo el mismo basePath que GitHub Pages, de modo que se prueba el
 * build de producción real (incluida la CSP) sin dependencias extra.
 *
 * Uso: `npm run build` y después `node e2e/serve.mjs [puerto]`.
 */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_PATH = '/youtube-playlist-analyzer';
const ROOT = fileURLToPath(new URL('../out', import.meta.url));
const PORT = Number(process.argv[2] ?? 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

async function resolveFile(urlPath) {
  const relative = normalize(decodeURIComponent(urlPath.slice(BASE_PATH.length)));
  const candidate = join(ROOT, relative);
  if (candidate !== ROOT && !candidate.startsWith(ROOT + sep)) return null;
  for (const path of [candidate, join(candidate, 'index.html')]) {
    const info = await stat(path).catch(() => null);
    if (info?.isFile()) return path;
  }
  return null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  if (pathname === '/') {
    res.writeHead(302, { Location: `${BASE_PATH}/` });
    res.end();
    return;
  }
  const file = pathname.startsWith(BASE_PATH)
    ? await resolveFile(pathname)
    : null;
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`Sirviendo ./out en http://localhost:${PORT}${BASE_PATH}/`);
});
