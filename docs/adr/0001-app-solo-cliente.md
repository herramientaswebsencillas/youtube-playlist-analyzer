# 0001. Aplicación 100 % en el navegador, sin backend

- **Estado:** Aceptada
- **Fecha:** 2026-06-22 (commit `1ab8944`; registrada el 2026-10-11)

## Contexto

La herramienta analiza playlists públicas y no necesita cuentas ni datos de
usuario en un servidor. Se buscaba un costo de operación nulo y un despliegue
simple.

## Decisión

Next.js con `output: 'export'`, publicado como sitio estático en GitHub
Pages. El navegador llama directamente a la YouTube Data API v3 con una clave
pública (`NEXT_PUBLIC_YOUTUBE_API_KEY`) y guarda los resultados en
LocalStorage ([0004](0004-localstorage-como-cache.md)).

## Alternativas descartadas

- **Backend o proxy propio** (servidor, Cloudflare Workers, funciones
  serverless): mantendría la clave en secreto y permitiría limitar peticiones
  por IP, a cambio de operar y pagar un componente más.
- **OAuth con la cuenta de Google del usuario:** la cuota sería por usuario,
  pero obligaría a iniciar sesión para leer datos públicos.

## Consecuencias

- La clave viaja en el JavaScript publicado. Su protección depende de
  Google Cloud: restricción por referente HTTP, restricción a la YouTube Data
  API y límites de cuota (README → «Configuración recomendada de la clave»).
- Cualquiera puede extraer la clave y gastar la cuota compartida; ver
  [0002](0002-recaptcha-sin-servidor.md).
- GitHub Pages no permite cabeceras HTTP propias; ver
  [0003](0003-csp-en-meta.md).
- No hay datos personales en un servidor propio, lo que simplifica la
  privacidad y la operación.
