# 0003. CSP declarada con `<meta>`

- **Estado:** Aceptada
- **Fecha:** 2026-09-30 (commit `6fa7a64`; registrada el 2026-10-11)

## Contexto

El sitio muestra datos que no controla (respuestas de la API y archivos JSON
importados). Se quería una Content-Security-Policy como defensa en
profundidad, pero GitHub Pages no permite cabeceras HTTP propias.

## Decisión

La CSP se declara con `<meta http-equiv="Content-Security-Policy">` en
`src/app/layout.tsx`, solo en producción (`next dev` necesita `eval` y
websockets). La política de referente también se declara con `<meta>`
(`metadata.referrer`). Un E2E comprueba que el build no produce violaciones
de CSP.

## Alternativas descartadas

- **Cabeceras HTTP reales** (Cloudflare Pages o Netlify con `_headers`):
  permitirían `frame-ancestors`, `X-Content-Type-Options` y HSTS propio, a
  cambio de mover el hosting y la URL pública.
- **CSP con hashes o nonces:** la exportación estática de Next.js incrusta
  scripts inline de hidratación que cambian en cada build; mantener los
  hashes exigiría un paso posterior al build.

## Consecuencias

- `script-src` necesita `'unsafe-inline'`, así que la CSP no frena un XSS que
  logre inyectar un script inline. La defensa principal sigue siendo el
  escape de React y `safeYouTubeUrl` para `href`/`src`.
- `frame-ancestors` no funciona en `<meta>`: el sitio puede incrustarse en un
  iframe. El riesgo es bajo porque no hay acciones con valor.
- Cada dominio nuevo (API, imágenes, scripts) debe agregarse a la CSP; el E2E
  lo detecta si se olvida.
