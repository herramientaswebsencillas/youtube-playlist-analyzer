# Guía de contribución

¡Gracias por tu interés en mejorar YouTube Playlist Analyzer!

## Preparar el entorno

1. Usa la versión de Node indicada en `.nvmrc` (`nvm use`).
2. Instala dependencias con `npm ci`.
3. Copia `.env.local.example` a `.env.local` y define al menos
   `NEXT_PUBLIC_YOUTUBE_API_KEY` (una clave propia, restringida a
   `localhost`). La site key de reCAPTCHA puede quedar vacía en desarrollo.
4. Arranca con `npm run dev`.

## Flujo de trabajo

- `main` siempre está desplegada: cada merge publica el sitio.
- Trabaja en una rama (`feat/...`, `fix/...`, `docs/...`) y abre un pull
  request hacia `main`.
- El pipeline ejecuta tipos, lint, formato, pruebas unitarias, revisión de
  vulnerabilidades de dependencias (`npm audit`), build y pruebas E2E. Un
  ruleset en `main` exige PR y el check `verify` en verde: no se puede
  hacer push directo.
- La plantilla de PR (`.github/pull_request_template.md`) recoge la lista de
  verificación de abajo.

## Antes de abrir el PR

```bash
npm run typecheck
npm run lint
npm run format:check   # o `npm run format` para corregir
npm test
NEXT_PUBLIC_YOUTUBE_API_KEY=e2e-dummy-key npm run build   # cualquier valor
npm run test:e2e   # la primera vez: npx playwright install chromium
```

- Si cambias una decisión documentada en `docs/adr/`, escribe un ADR nuevo
  que la reemplace. Si agregas un proveedor o dominio externo, actualiza la
  CSP y `docs/amenazas.md`.

- Agrega o actualiza pruebas cuando cambies la lógica de `src/lib` (por
  ejemplo, heurísticas de normalización o el formato de importación).
- Si cambias variables de entorno, comandos o comportamiento visible,
  actualiza el README, `.env.local.example`, el aviso de privacidad o los
  términos de uso en el mismo PR.
- Nunca subas claves reales: `.env.local` está en `.gitignore` y solo se
  versiona la plantilla vacía.

## Mensajes de commit

Explica qué cambia y por qué, en una línea clara (por ejemplo, «Detecta
duplicados aunque el título incluya "(Remastered 2011)"»). Evita mensajes
genéricos como «mejoras» o «cambios».

## Reportes de seguridad

No los publiques como issue: sigue [SECURITY.md](SECURITY.md).
